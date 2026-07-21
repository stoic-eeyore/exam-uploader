import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })

  // Total count
  const total = await payload.count({ collection: 'exams' })

  // Count per status — parallel for speed
  const [uploaded, extracting, review, consultation, completed, failed] = await Promise.all([
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'uploaded' } } }),
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'extracting' } } }),
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'review' } } }),
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'consultation' } } }),
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'completed' } } }),
    payload.count({ collection: 'exams', where: { processingStatus: { equals: 'failed' } } }),
  ])

  return NextResponse.json({
    total: total.totalDocs,
    byStatus: {
      uploaded: uploaded.totalDocs,
      extracting: extracting.totalDocs,
      review: review.totalDocs,
      consultation: consultation.totalDocs,
      completed: completed.totalDocs,
      failed: failed.totalDocs,
    },
  })
}
