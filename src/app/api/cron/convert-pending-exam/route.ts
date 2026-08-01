import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'
import config from '@payload-config'
import { convertVerifiedExam } from '@/lib/examConversion'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  console.log('[cron/convert-pending-exam] Triggered pending exam conversion cron job')

  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pending-exams',
    where: {
      status: {
        equals: 'verified',
      },
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })
  console.log(`[cron/convert-pending-exam] Found ${result.totalDocs} pending exams to be converted`)

  if (result.docs.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No pending exams to convert',
    })
  }

  const exam = result.docs[0]

  console.log(`[cron/convert-pending-exam] Converting pending exam with ID: ${exam.id}`)
  const analysis = await convertVerifiedExam(payload, exam.id)
  console.log(`[cron/convert-pending-exam] returns ${JSON.stringify(analysis)}`)

  return NextResponse.json({
    success: true,
    message: `Converted pending exam with ID: ${exam.id}`,
  })
}
