import config from '@payload-config'
import { getPayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { extractJson } from '@/utils/json'

const ANSWER_BATCH_SIZE = 10

type QuestionForAI = {
  id: string
  questionNumber: number
  questionType: 'mcq' | 'essay'
  questionText: string
  options: {
    text?: string | null
  }[]
  images: string[]
  stimulusId?: string
}

type StimulusForAI = {
  id: string
  content: string
  images: string[]
}

type ValidityStatus = 'valid' | 'ambiguous' | 'invalid'

type AIAnswer = {
  questionNumber: number
  questionType: 'mcq' | 'essay'
  validityStatus: ValidityStatus
  validityConfidence: number
  answerConfidence: number
  answer: string
  explanation: string
  notes: string
}

type AIResponse = {
  answers: AIAnswer[]
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

type ImagePart = {
  mimeType: string
  data: string
}

async function urlToImagePart(url: string): Promise<ImagePart> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`)
  }

  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    mimeType,
    data: buffer.toString('base64'),
  }
}

async function loadImages(urls: string[]): Promise<ImagePart[]> {
  const validUrls = urls.filter(Boolean)

  return Promise.all(validUrls.map(urlToImagePart))
}

export async function answerExamQuestions(examId: string) {
  const payload = await getPayload({
    config,
  })

  const questionsResult = await payload.find({
    collection: 'questions',
    where: {
      and: [
        {
          exam: {
            equals: examId,
          },
        },
        {
          or: [
            {
              answer: {
                exists: false,
              },
            },
            {
              explanation: {
                exists: false,
              },
            },
          ],
        },
      ],
    },
    limit: 50,
    depth: 1,
    sort: 'questionNumber',
  })

  const questions: QuestionForAI[] = questionsResult.docs
    .filter(
      (question) =>
        question.questionNumber != null &&
        question.questionText != null &&
        question.questionType != null,
    )
    .map((question) => ({
      id: String(question.id),
      questionNumber: question.questionNumber!,
      questionType: question.questionType as 'mcq' | 'essay',
      questionText: question.questionText!,
      options:
        question.options?.map((option) => ({
          text: option.text || null,
        })) || [],
      images: question.images?.map((image) => image.url) || [],
      stimulusId:
        typeof question.stimulus === 'object' && question.stimulus
          ? String(question.stimulus.id)
          : question.stimulus
            ? String(question.stimulus)
            : undefined,
    }))

  if (questions.length === 0) {
    console.log(`[answer-questions] No unanswered questions for exam ${examId}`)
    return
  }

  const stimuli = new Map<string, StimulusForAI>()

  for (const question of questionsResult.docs) {
    if (typeof question.stimulus === 'object' && question.stimulus && question.stimulus.id) {
      stimuli.set(String(question.stimulus.id), {
        id: String(question.stimulus.id),
        content: question.stimulus.content || '',
        images: question.stimulus.images?.map((image) => image.url) || [],
      })
    }
  }

  const batches = chunk(questions, ANSWER_BATCH_SIZE)

  console.log(
    `[answer-questions] Answering ${questions.length} questions in ${batches.length} batches`,
  )

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    console.log(
      `[answer-questions] Batch ${i + 1}/${batches.length}: questions ${batch[0].questionNumber}-${batch[batch.length - 1].questionNumber}`,
    )

    await answerQuestionBatch(payload, batch, stimuli)
  }

  console.log(`[answer-questions] Finished exam ${examId}`)
}

export async function answerSingleQuestion(questionId: string) {
  const payload = await getPayload({
    config,
  })

  const question = await payload.findByID({
    collection: 'questions',
    id: questionId,
    depth: 1,
  })

  if (!question) {
    throw new Error('Question not found')
  }

  if (question.questionNumber == null || !question.questionText || !question.questionType) {
    throw new Error('Question is missing required data')
  }

  const questionForAI: QuestionForAI = {
    id: String(question.id),
    questionNumber: question.questionNumber,
    questionType: question.questionType as 'mcq' | 'essay',
    questionText: question.questionText,
    options:
      question.options?.map((option) => ({
        text: option.text || null,
      })) || [],
    images: question.images?.map((image) => image.url || '') || [],
    stimulusId:
      typeof question.stimulus === 'object' && question.stimulus
        ? String(question.stimulus.id)
        : question.stimulus
          ? String(question.stimulus)
          : undefined,
  }

  const stimuli = new Map<string, StimulusForAI>()

  if (typeof question.stimulus === 'object' && question.stimulus && question.stimulus.id) {
    stimuli.set(String(question.stimulus.id), {
      id: String(question.stimulus.id),
      content: question.stimulus.content || '',
      images: question.stimulus.images?.map((image) => image.url) || [],
    })
  }

  await answerQuestionBatch(payload, [questionForAI], stimuli)

  // Return the fresh question so the UI can immediately update.
  return payload.findByID({
    collection: 'questions',
    id: questionId,
    depth: 1,
  })
}

async function answerQuestionBatch(
  payload: Awaited<ReturnType<typeof getPayload>>,
  questions: QuestionForAI[],
  stimuli: Map<string, StimulusForAI>,
) {
  const input = {
    stimuli: Array.from(stimuli.values()).map((stimulus) => ({
      id: stimulus.id,
      content: stimulus.content,
      hasImages: stimulus.images.length > 0,
      imageCount: stimulus.images.length,
    })),

    questions: questions.map((question) => ({
      questionNumber: question.questionNumber,
      questionType: question.questionType,
      questionText: question.questionText,
      options: question.options,
      stimulusId: question.stimulusId ?? null,
      hasImages: question.images.length > 0,
      imageCount: question.images.length,
    })),
  }

  const prompt = `
  You are an expert educational assessment solver specializing in STEM and general academic testing.

Your task is to evaluate the validity of each question provided, solve it independently, and return a structured JSON response.

## EVALUATION & SOLVING PROCEDURE

For each question, complete these steps in order:
1. Validate Question: Check if the question is complete, clear, and uncorrupted. Verify if required stimulus/images are present. For multiple-choice questions, check that exactly one option is defensibly correct.
2. Solve Independently: Derive the answer step-by-step from core principles, chemical properties, or mathematical formulas without relying on the given options.
3. Match & Verify: Compare your derived result against all options (for MCQs). Verify that your answer, explanation, reasoning, and confidence scores are fully consistent with each other.

## SPECIFIC QUESTION-TYPE RULES

### Multiple-Choice Questions (MCQ)
- If valid with exactly ONE correct option: Set \`answer\` to the option letter (e.g., "A", "B", "C").
- If NO option is correct, MORE THAN ONE option is correct, or essential information/images are missing:
  - Set \`validityStatus\` to \`"invalid"\` or \`"ambiguous"\`.
  - Set \`answer\` to \`"Unable to determine"\`.
  - Set \`answerConfidence\` to \`0\`.
  - In \`explanation\`, specify exactly why the question is invalid, ambiguous, or missing data, and state the true answer if it can be derived.

### Essay / Free-Response Questions
- Set \`answer\` to a comprehensive model answer that warrants full marks.
- Include key structural criteria, required terminology, and rubric points in \`explanation\`.

## CONFIDENCE & VALIDITY DEFINITIONS
- \`validityStatus\`: \`"valid"\` (clear, single correct answer), \`"ambiguous"\` (multiple reasonable interpretations or correct answers), or \`"invalid"\` (missing essential data, broken image, or conceptually flawed).
- \`validityConfidence\`: Integer from 0 to 100 representing confidence in your \`validityStatus\` assessment.
- \`answerConfidence\`: Integer from 0 to 100 representing confidence in your derived \`answer\` (must be 0 if \`answer\` is "Unable to determine").

## FORMATTING & OUTPUT RULES

Return ONLY valid JSON matching the schema below. Your response must begin immediately with \`{\` and end with \`}\`. Do not include markdown code fences (\`\`\`json), backticks, or text outside the JSON object.

1. Markdown & LaTeX Allowed: You MAY use standard Markdown (lists, bolding) and LaTeX notation for math formulas and chemistry equations inside string fields (\`reasoning\`, \`answer\`, \`explanation\`).
2. Mandatory Double-Escaping: Strictly double-escape all backslashes used in LaTeX or formatting within JSON string values (for example, write \`\\frac{a}{b}\`, \`\\rightarrow\`, and \`\\Delta H\` instead of single backslashes) to ensure the payload parses cleanly in JSON parsers.

EXPECTED JSON SCHEMA EXAMPLE:

{
  "answers": [
    {
      "questionNumber": 1,
      "questionType": "mcq",
      "validityStatus": "valid",
      "validityConfidence": 98,
      "answerConfidence": 95,
      "reasoning": "Step 1: Write the balanced chemical equation: N_2 + 3H_2 \\rightarrow 2NH_3. Step 2: Use equilibrium constant expression K_eq = [NH_3]^2 / ([N_2][H_2]^3). Step 3: Substitute given values: K_eq = (0.40)^2 / ((0.10)(0.20)^3) = 0.16 / 0.0008 = 200. Step 4: Compare with options; Option C matches 200.",
      "answer": "C",
      "explanation": "Using the equilibrium expression $K_{eq} = \\frac{[NH_3]^2}{[N_2][H_2]^3}$, substituting the equilibrium concentrations gives $K_{eq} = \\frac{(0.40)^2}{(0.10)(0.20)^3} = 200$."
    },
    {
      "questionNumber": 2,
      "questionType": "essay",
      "validityStatus": "valid",
      "validityConfidence": 100,
      "answerConfidence": 90,
      "reasoning": "Outline solution steps for quadratic equation ax^2 + bx + c = 0 using the quadratic formula x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}. Derive roots for x^2 - 5x + 6 = 0.",
      "answer": "To solve $x^2 - 5x + 6 = 0$, apply the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ with $a=1, b=-5, c=6$. This yields $x = \\frac{5 \\pm \\sqrt{25 - 24}}{2} = \\frac{5 \\pm 1}{2}$, giving roots $x = 3$ and $x = 2$.",
      "explanation": "A full-mark answer must explicitly state the quadratic formula, show correct substitution of coefficients, evaluate the discriminant ($b^2 - 4ac = 1$), and state both roots."
    }
  ]
}
Questions:

${JSON.stringify(input, null, 2)}
  `

  const imageParts: {
    questionNumber: number
    questionType: 'mcq' | 'essay'
    images: ImagePart[]
  }[] = []

  for (const question of questions) {
    if (question.images.length === 0) continue

    const images = await loadImages(question.images)

    imageParts.push({
      questionNumber: question.questionNumber,
      questionType: question.questionType,
      images,
    })
  }

  const stimulusImageParts: {
    stimulusId: string
    images: ImagePart[]
  }[] = []

  for (const stimulus of stimuli.values()) {
    if (stimulus.images.length === 0) continue

    const images = await loadImages(stimulus.images)

    stimulusImageParts.push({
      stimulusId: stimulus.id,
      images,
    })
  }

  const contentParts: any[] = [
    {
      text: prompt,
    },
  ]

  // Add stimulus images
  for (const stimulus of stimulusImageParts) {
    contentParts.push({
      text: `The following image(s) belong to stimulus ID "${stimulus.stimulusId}".`,
    })

    for (const image of stimulus.images) {
      contentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      })
    }
  }

  // Add question images
  for (const question of imageParts) {
    contentParts.push({
      text: `The following image(s) belong to question ${question.questionNumber} (${question.questionType}).`,
    })

    for (const image of question.images) {
      contentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      })
    }
  }

  const result = await geminiModel.generateContent(contentParts)

  const text = result.response.text()
  const cleaned = extractJson(text)
  const parsed = JSON.parse(cleaned) as AIResponse

  if (!Array.isArray(parsed.answers)) {
    throw new Error('Gemini response does not contain an answers array')
  }

  const questionMap = new Map(
    questions.map((question) => [`${question.questionNumber}_${question.questionType}`, question]),
  )

  const validStatuses: ValidityStatus[] = ['valid', 'ambiguous', 'invalid']

  for (const answer of parsed.answers) {
    const question = questionMap.get(`${answer.questionNumber}_${answer.questionType}`)

    if (!question) {
      console.warn(
        `[answer-questions] Gemini returned unknown question ${answer.questionNumber}_${answer.questionType}`,
      )
      continue
    }

    const confidenceIsValid = (value: unknown): value is number =>
      Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100

    if (
      !answer.answer ||
      !answer.explanation ||
      !validStatuses.includes(answer.validityStatus) ||
      !confidenceIsValid(answer.validityConfidence) ||
      !confidenceIsValid(answer.answerConfidence) ||
      typeof answer.notes !== 'string'
    ) {
      console.warn(
        `[answer-questions] Invalid or incomplete response for question ${answer.questionNumber}`,
      )
      continue
    }

    if (answer.validityStatus !== 'valid' && answer.answer !== 'Unable to determine') {
      console.warn(
        `[answer-questions] Inconsistent validity and answer for question ${answer.questionNumber}`,
      )
      continue
    }

    if (answer.answer === 'Unable to determine' && answer.answerConfidence !== 0) {
      console.warn(
        `[answer-questions] Invalid answer confidence for question ${answer.questionNumber}`,
      )
      continue
    }

    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        answer: answer.answer,
        explanation: answer.explanation,
        validityStatus: answer.validityStatus,
        validityConfidence: answer.validityConfidence,
        answerConfidence: answer.answerConfidence,
        answerNotes: answer.notes,
        answerAiRawResponse: text,
      },
    })
  }
}
