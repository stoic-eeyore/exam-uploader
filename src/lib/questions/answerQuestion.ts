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
  stimulusId?: string
}

type StimulusForAI = {
  id: string
  content: string
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
    })),
  }

  const result = await geminiModel.generateContent([
    {
      text: `
You are an expert educational assessment solver.

Your task is to solve each exam question provided below.

For every question:

1. Determine the correct answer.
2. Provide a concise but sufficiently clear explanation supporting the answer.

For multiple-choice questions:
- Return the answer as the option letter (A, B, C, etc.).
- Make sure the selected option is actually supported by the question.
- Do not assume an answer merely because one option appears more plausible.
- Check all options before deciding on the answer.

For essay questions:
- Provide a model answer that would reasonably receive full marks.
- The answer should directly address what the question asks.
- Include the key points that a strong student answer should contain.

If a question cannot be answered reliably:
- Set "answer" to "Unable to determine".
- Explain clearly in the "explanation" field why the answer cannot be determined.
- Examples include missing information, missing stimulus/image, genuinely ambiguous wording, or no defensible correct answer.
- Do not invent information or force an answer simply to produce a result.

Some questions reference a stimulus.

When a question contains a stimulusId, use the corresponding stimulus when solving the question.

If the question requires information from a stimulus or image that is not available:
- Set answer to "Unable to determine".
- Explain specifically what information is missing.
- Do not guess.

The explanation may use Markdown and LaTeX where appropriate.
For mathematical formulas, use standard Markdown-compatible LaTeX notation such as:
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

Important:
- Analyze every question independently.
- Do not use information from one question to answer another.
- Do not modify the question text.
- Do not skip any question.
- Return exactly one result for every input question.
- questionNumber and questionType must exactly match the input.
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown code fences.

Expected format:

{
  "answers": [
    {
      "questionNumber": 1,
      "questionType": "mcq",
      "answer": "B",
      "explanation": "..."
    }
  ]
}

Questions:

${JSON.stringify(input, null, 2)}
      `,
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
