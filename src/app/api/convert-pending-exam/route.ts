import { NextRequest, NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { organizeInDrive } from '@/lib/googleDrive'
import { generateExamFilename } from '@/utils/exam'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Received convert request with body:', body)
    const { pendingExamId, label, year, grade, subject } = body

    const requiredFields = { pendingExamId, label, year, grade, subject }
    for (const [key, value] of Object.entries(requiredFields)) {
      // Checks if field is undefined, null, or an empty string/just spaces
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        return NextResponse.json(
          { error: `Missing or empty required field: ${key}` },
          { status: 400 },
        )
      }
    }

    const payload = await getPayloadClient()

    const [gradeDoc, subjectDoc] = await Promise.all([
      payload.findByID({
        collection: 'grades',
        id: grade,
      }),

      payload.findByID({
        collection: 'subjects',
        id: subject,
      }),
    ])

    if (!subjectDoc || !gradeDoc) {
      return NextResponse.json(
        { error: 'Specified Subject or Grade record not found' },
        { status: 404 },
      )
    }

    const subjectName = subjectDoc.code || 'xxx'
    const gradeName = gradeDoc.code || 'xxx'

    // Load pending exam
    const pendingExam = await payload.findByID({
      collection: 'pending-exams',
      id: pendingExamId,
    })

    if (!pendingExam) {
      return NextResponse.json({ error: 'Pending exam not found' }, { status: 404 })
    }

    const newFileName = generateExamFilename(gradeName, subjectName, year, label)

    // Move file in Google Drive
    await organizeInDrive(
      pendingExam.driveFileId,
      process.env.GOOGLE_DRIVE_DROPBOX_FOLDER_ID!,
      year,
      gradeName,
      subjectName,
      newFileName,
    )

    // Create actual exam
    const exam = await payload.create({
      collection: 'exams',
      data: {
        title: pendingExam.filename,
        label,
        year,
        grade,
        subject,
        driveUrl: pendingExam.driveUrl,
        fileHash: pendingExam.fileHash,
      },
    })

    // Mark as processed
    await payload.update({
      collection: 'pending-exams',
      id: pendingExam.id,
      data: {
        processed: true,
      },
    })

    return NextResponse.json({
      success: true,
      exam,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json({ error: 'Failed to convert exam' }, { status: 500 })
  }
}
