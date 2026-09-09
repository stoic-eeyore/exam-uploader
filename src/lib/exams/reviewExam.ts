import config from '@payload-config'
import { getPayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { extractJson } from '@/utils/json'
import { getExamConsultationData } from './getExamConsultationData'

import fs from 'node:fs'
import path from 'node:path'

const template = fs.readFileSync(path.join(process.cwd(), 'src/prompts/reviewExam.md'), 'utf8')

type ImageData = {
  url: string
  placement?: string | null
  width?: number | null
  alt?: string | null
}

type ImagePart = {
  text: string
  image: ImageData
}

async function imageUrlToInlineData(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status} ${response.statusText})`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'

  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image: ${url} (${contentType})`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    mimeType: contentType,
    data: buffer.toString('base64'),
  }
}

async function buildImageParts(examData: any): Promise<ImagePart[]> {
  const imageParts: ImagePart[] = []

  // Keep track of URLs we've already fetched.
  // This is particularly useful when many questions share one stimulus.
  const seenUrls = new Set<string>()

  // Stimulus images
  for (const stimulus of examData.stimuli || []) {
    for (const image of stimulus.images || []) {
      if (!image?.url || seenUrls.has(image.url)) {
        continue
      }

      seenUrls.add(image.url)

      imageParts.push({
        text: `IMAGE FOR STIMULUS ${stimulus.number}${image.alt ? `: ${image.alt}` : ''}`,
        image,
      })
    }
  }

  // Question images
  for (const question of examData.questions || []) {
    for (const image of question.images || []) {
      if (!image?.url || seenUrls.has(image.url)) {
        continue
      }

      seenUrls.add(image.url)

      imageParts.push({
        text: `IMAGE FOR QUESTION ${question.number} (${question.type})${
          image.alt ? `: ${image.alt}` : ''
        }`,
        image,
      })
    }
  }

  return imageParts
}

export async function reviewExam(examId: string) {
  const payload = await getPayload({
    config,
  })

  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam) {
    throw new Error('Exam not found')
  }

  console.log(`Preparing AI review data for exam ${exam.id}`)

  const examData = await getExamConsultationData(examId)

  if (!examData.questions.length) {
    throw new Error('Exam has no questions')
  }

  console.log(`Starting AI review for exam ${exam.id} with ${examData.questions.length} questions`)

  const prompt = template.replace('{{examData}}', JSON.stringify(examData, null, 2))

  console.log('Preparing exam images for Gemini...')

  const imageParts = await buildImageParts(examData)

  console.log(`Found ${imageParts.length} unique images to send to Gemini`)

  const geminiParts: Array<
    | { text: string }
    | {
        inlineData: {
          mimeType: string
          data: string
        }
      }
  > = [
    {
      text: prompt,
    },
  ]

  for (const imagePart of imageParts) {
    try {
      console.log(`Fetching image: ${imagePart.text}`)

      const inlineData = await imageUrlToInlineData(imagePart.image.url)

      // Give Gemini an explicit label immediately before the image.
      geminiParts.push({
        text: imagePart.text,
      })

      geminiParts.push({
        inlineData,
      })
    } catch (error) {
      console.warn(`Could not load image ${imagePart.image.url}:`, error)

      // Don't fail the entire exam review because one image is unavailable.
      geminiParts.push({
        text: `${imagePart.text} — IMAGE COULD NOT BE LOADED: ${imagePart.image.url}`,
      })
    }
  }

  console.log(`Sending exam review to Gemini with ${imageParts.length} images`)

  const result = await geminiModel.generateContent(geminiParts)

  const text = result.response.text()

  console.log(`Received AI review for exam ${exam.id}`)

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      aiRawResponse: text,
    },
  })

  const cleaned = extractJson(text)
  const parsed = JSON.parse(cleaned)

  console.log(`Parsed AI review for exam ${exam.id}`)

  const questionsResult = await payload.find({
    collection: 'questions',
    where: {
      exam: {
        equals: examId,
      },
    },
    limit: 500,
  })

  const questionMap = new Map(
    questionsResult.docs.map((question) => [
      `${question.questionNumber}_${question.questionType}`,
      question,
    ]),
  )

  for (const review of parsed.questionReviews || []) {
    const question = questionMap.get(`${review.questionNumber}_${review.questionType}`)

    if (!question) {
      console.warn(`Could not find question ${review.questionNumber}_${review.questionType}`)
      continue
    }

    console.log(`Updating question ${question.id}: ${review.cognitiveLevel}`)

    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        reviewedByAI: true,
        cognitiveLevel: review.cognitiveLevel,
        qualityIssues: review.correctnessIssues || [],
      },
    })
  }

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      reviewedByAI: true,
      examReview: parsed.examReview,
    },
  })

  console.log(`Completed AI review for exam ${exam.id}`)

  return parsed
}
