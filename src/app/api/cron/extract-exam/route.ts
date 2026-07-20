import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'
import config from '@payload-config'
import { extractExamQuestions } from '@/lib/examExtraction'
import { reviewExamQuestions } from '@/lib/reviewExamQuestions'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  console.log('[cron/extract-exam] Triggered exam extraction cron job')

  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  await extractExam(payload)
  await reviewExam(payload)

  return NextResponse.json({
    success: true,
  })
}

async function extractExam(payload: BasePayload) {
  const result = await payload.find({
    collection: 'exams',
    where: {
      processingStatus: {
        equals: 'uploaded',
      },
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })
  console.log(`[cron/extract-exam] Found ${result.totalDocs} exams to be extracted`)

  if (result.docs.length > 0) {
    const exam = result.docs[0]

    console.log(`[cron/extract-exam] Extracting exam with ID: ${exam.id}`)
    const extracted = await extractExamQuestions(String(exam.id))
    console.log(`[cron/extract-exam] ExtractExamQuestions returns ${extracted}`)
  }
}

async function reviewExam(payload: BasePayload) {
  const result = await payload.find({
    collection: 'exams',
    where: {
      and: [
        {
          processingStatus: {
            equals: 'review',
          },
        },
        {
          reviewedByAI: {
            equals: false,
          },
        },
      ],
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })
  console.log(`[cron/extract-exam] Found ${result.totalDocs} exams to be reviewed`)

  if (result.docs.length > 0) {
    const exam = result.docs[0]

    console.log(`[cron/extract-exam] Reviewing exam with ID: ${exam.id}`)
    const reviewed = await reviewExamQuestions(String(exam.id))
    console.log(`[cron/extract-exam] returns ${reviewed}`)
  }
}
