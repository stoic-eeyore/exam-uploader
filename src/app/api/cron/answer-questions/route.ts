import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'
import config from '@payload-config'
import { answerExamQuestions } from '@/lib/questions/answerQuestion'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  console.log('[cron/answer-questions] Triggered')

  const authHeader = req.headers.get('authorization')

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const examId = req.nextUrl.searchParams.get('examId')

  const payload = await getPayload({ config })

  // Explicit exam ID = process that entire exam
  if (examId) {
    console.log(`[cron/answer-questions] Urgent processing requested for exam ${examId}`)

    const exam = await payload.findByID({
      collection: 'exams',
      id: examId,
    })

    if (!exam) {
      return NextResponse.json({ error: `Exam ${examId} not found` }, { status: 404 })
    }

    await answerExamQuestions(examId)

    return NextResponse.json({
      success: true,
      examId,
      mode: 'specific',
    })
  }

  // No exam ID = process the oldest unanswered question
  const question = await findOldestUnansweredQuestion(payload)

  if (!question) {
    console.log('[cron/answer-questions] No unanswered questions')

    return NextResponse.json({
      success: true,
      mode: 'queue',
      processed: false,
      message: 'No unanswered questions',
    })
  }

  const questionExamId = typeof question.exam === 'object' ? question.exam?.id : question.exam

  if (!questionExamId) {
    console.warn(`[cron/answer-questions] Question ${question.id} has no exam`)

    return NextResponse.json({
      success: true,
      mode: 'queue',
      processed: false,
      message: `Question ${question.id} has no exam`,
    })
  }

  console.log(
    `[cron/answer-questions] Processing oldest unanswered question ${question.id} from exam ${questionExamId}`,
  )

  await answerExamQuestions(String(questionExamId))

  return NextResponse.json({
    success: true,
    mode: 'queue',
    processed: true,
    questionId: question.id,
    examId: questionExamId,
  })
}

async function findOldestUnansweredQuestion(payload: BasePayload) {
  const result = await payload.find({
    collection: 'questions',
    where: {
      and: [
        {
          answer: {
            equals: null,
          },
        },
        {
          exam: {
            exists: true,
          },
        },
      ],
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })

  return result.docs[0] ?? null
}
