import { getPayloadClient } from '@/lib/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayloadClient()

  const recentUploads = await payload.find({
    collection: 'exams',
    limit: 200,
    sort: '-createdAt',
    // Switch to depth: 0 if you don't need related user/category objects populated
    depth: 1,
  })

  return NextResponse.json({
    totalExams: recentUploads.totalDocs,
    recent: recentUploads.docs,
  })
}
