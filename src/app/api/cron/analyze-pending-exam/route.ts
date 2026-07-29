import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'
import config from '@payload-config'
import { analyzePendingExam } from '@/lib/analyzePendingExam'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  console.log('[cron/analyze-pending-exam] Triggered pending exam analysis cron job')

  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pending-exams',
    where: {
      status: {
        equals: 'new',
      },
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })
  console.log(`[cron/analyze-pending-exam] Found ${result.totalDocs} pending exams to be analyzed`)

  if (result.docs.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No pending exams to analyze',
    })
  }

  const exam = result.docs[0]

  console.log(`[cron/analyze-pending-exam] Analyzing pending exam with ID: ${exam.id}`)
  const analysis = await analyzePendingExam(payload, String(exam.id))
  console.log(`[cron/analyze-pending-exam] returns ${JSON.stringify(analysis)}`)

  return NextResponse.json({
    success: true,
    message: JSON.stringify({ analysis }),
  })
}
