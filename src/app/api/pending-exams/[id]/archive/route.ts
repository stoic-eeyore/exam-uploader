import { NextRequest, NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { moveToArchiveFolder } from '@/lib/googleDrive'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const payload = await getPayloadClient()

    const pendingExam = await payload.findByID({
      collection: 'pending-exams',
      id,
    })

    if (!pendingExam) {
      return NextResponse.json({ error: 'Pending exam not found' }, { status: 404 })
    }

    if (!pendingExam.driveFileId) {
      return NextResponse.json(
        { error: 'Pending exam has no associated drive file' },
        { status: 400 },
      )
    }

    await moveToArchiveFolder({
      fileId: pendingExam.driveFileId,
      filename: pendingExam.filename,
    })

    const updated = await payload.update({
      collection: 'pending-exams',
      id: pendingExam.id,
      data: {
        status: 'archived',
      },
    })

    return NextResponse.json({
      success: true,
      exam: updated,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json({ error: 'Failed to archive exam' }, { status: 500 })
  }
}
