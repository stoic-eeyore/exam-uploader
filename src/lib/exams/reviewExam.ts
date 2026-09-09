import config from '@payload-config'
import { getPayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { extractJson } from '@/utils/json'
import { getExamConsultationData } from './getExamConsultationData'
import fs from 'node:fs'
import path from 'node:path'

const template = fs.readFileSync(path.join(process.cwd(), 'src/prompts/reviewExam.md'), 'utf8')

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
  const result = await geminiModel.generateContent([
    {
      text: prompt,
    },
  ])

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
