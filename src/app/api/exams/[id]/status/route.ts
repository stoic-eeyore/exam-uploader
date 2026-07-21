import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const VALID_STATUSES = [
  'uploaded',
  'extracting',
  'review',
  'consultation',
  'completed',
  'failed',
] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let body: { processingStatus?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { processingStatus } = body

  if (!processingStatus || !VALID_STATUSES.includes(processingStatus as any)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })

  try {
    const updated = await payload.update({
      collection: 'exams',
      id,
      data: {
        processingStatus,
      } as any,
    })

    return NextResponse.json({
      success: true,
      examId: id,
      processingStatus: updated.processingStatus,
    })
  } catch (err) {
    console.error(`[PATCH /api/exams/${id}/status]`, err)
    return NextResponse.json({ error: 'Failed to update exam status' }, { status: 500 })
  }
}
