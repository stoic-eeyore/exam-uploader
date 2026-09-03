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

type AIAnswer = {
  questionNumber: number
  questionType: 'mcq' | 'essay'
  answer: string
  explanation: string
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
    stimuli: Array.from(stimuli.values()),
    questions: questions.map((question) => ({
      questionNumber: question.questionNumber,
      questionType: question.questionType,
      questionText: question.questionText,
      options: question.options,
      stimulusId: question.stimulusId ?? null,
      images: question.images,
    })),
  }

  const prompt = `
You are an expert educational assessment solver.

Your task is to first evaluate the validity of each exam question provided below, and then solve it if it is valid.

CRITICAL PROCESS FOR EVERY QUESTION:
You must perform a strict validation check BEFORE trying to find a correct answer. A question is considered INVALID if it has missing information, missing important stimulus/images, completely ambiguous wording, typos that alter the core logic, or if a multiple-choice question contains zero correct options or more than one correct option.

Follow these steps in order for every question:

1. VALIDATION: Check if the question can be reliably answered. If it cannot, you MUST set the "answer" field strictly to "Unable to determine" and provide a detailed reason in the "explanation" field detailing exactly what is missing or broken. Do not invent context or guess.
2. DETERMINE ANSWER: If valid, determine the exact correct answer.
3. EXPLAIN: Provide a concise but sufficiently clear explanation supporting that answer.

For multiple-choice questions:
- Return the answer as the option letter (A, B, C, etc.).
- Make sure the selected option is strictly supported by the text.
- Do not assume an answer merely because one option appears more plausible than the others.
- If you find that more than one option is completely correct and defensible, do not guess between them. Fail the validation step immediately and return "Unable to determine"
- Check all options completely before deciding on the final answer. If all options are factually incorrect, fail the validation step and mark as "Unable to determine".

For essay questions:
- Provide a model answer that would reasonably receive full marks.
- The answer must directly address what the question asks.
- Include the key structural points that a strong student answer should contain.

Context and Stimulus Rules:
- Some questions reference a stimulus. When a question contains a stimulusId, use the corresponding stimulus when solving the question.
- If the question requires information from a stimulus, passage, or image that is not explicitly provided in the payload, you MUST fail validation, set the answer to "Unable to determine", and state specifically what information is missing.

Formatting Rules:
- The explanation may use Markdown and LaTeX where appropriate.
- For mathematical formulas, use standard Markdown-compatible LaTeX notation such as:
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
- Analyze every question completely independently. Do not carry over data between questions.
- Do not modify the question text or skip any question.
- Return exactly one result for every input question.
- questionNumber and questionType must exactly match the input.
- Return ONLY valid JSON. Do not wrap the JSON in markdown code fences or backticks.

Expected format:
{
  "answers": [
    {
      "questionNumber": 1,
      "questionType": "mcq",
      "answer": "B",
      "explanation": "Step-by-step logic proving why B is correct..."
    },
    {
      "questionNumber": 2,
      "questionType": "mcq",
      "answer": "Unable to determine",
      "explanation": "Validation failed: The question asks to identify a feature in Diagram A, but no diagram or stimulus payload was provided."
    }
  ]
}

Questions:

${JSON.stringify(input, null, 2)}
      `

  const result = await geminiModel.generateContent([
    {
      text: prompt,
    },
  ])

  const text = result.response.text()
  const cleaned = extractJson(text)
  const parsed = JSON.parse(cleaned) as AIResponse

  if (!Array.isArray(parsed.answers)) {
    throw new Error('Gemini response does not contain an answers array')
  }

  const questionMap = new Map(
    questions.map((question) => [`${question.questionNumber}_${question.questionType}`, question]),
  )

  for (const answer of parsed.answers) {
    const question = questionMap.get(`${answer.questionNumber}_${answer.questionType}`)

    if (!question) {
      console.warn(
        `[answer-questions] Gemini returned unknown question ${answer.questionNumber}_${answer.questionType}`,
      )
      continue
    }

    if (!answer.answer || !answer.explanation) {
      console.warn(`[answer-questions] Incomplete answer for question ${answer.questionNumber}`)
      continue
    }

    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        answer: answer.answer,
        explanation: answer.explanation,
        answerAiRawResponse: text,
      },
    })
  }
}
