import { getPayloadClient } from '@/lib/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayloadClient()

  // Total exams
  const exams = await payload.find({
    collection: 'exams',
    limit: 0,
  })

  // Recent uploads
  const recent = await payload.find({
    collection: 'exams',
    limit: 5,
    sort: '-createdAt',
    depth: 1,
  })

  return NextResponse.json({
    totalExams: exams.totalDocs,
    recent: recent.docs,
  })
}

