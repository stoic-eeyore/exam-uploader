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

  const processedExamId = await processNextExam(payload)

  return NextResponse.json({
    success: true,
    examId: processedExamId,
    mode: 'queue',
  })
}

async function processNextExam(payload: BasePayload) {
  const result = await payload.find({
    collection: 'exams',
    where: {
      processingStatus: {
        equals: 'review',
      },
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })

  console.log(`[cron/answer-questions] Found ${result.totalDocs} exams in review`)

  if (result.docs.length === 0) {
    console.log('[cron/answer-questions] Nothing to process')
    return false
  }

  const exam = result.docs[0]

  console.log(`[cron/answer-questions] Processing exam ${exam.id}: ${exam.filename}`)

  await answerExamQuestions(String(exam.id))

  console.log(`[cron/answer-questions] Finished answering exam ${exam.id}`)

  return true
}
