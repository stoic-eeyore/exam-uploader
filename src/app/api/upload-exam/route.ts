import { getPayloadClient } from '@/lib/payload'
import { uploadToDrive } from '@/lib/googleDrive'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const payload = await getPayloadClient()
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const rawPayload = formData.get('_payload')

  if (!rawPayload || typeof rawPayload !== 'string') {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
  }

  const data = JSON.parse(rawPayload)

  const [gradeDoc, subjectDoc] = await Promise.all([
    payload.findByID({
      collection: 'grades',
      id: data.grade,
    }),

    payload.findByID({
      collection: 'subjects',
      id: data.subject,
    }),
  ])

  const gradeName = gradeDoc?.code || gradeDoc?.name || 'Unknown Grade'
  const subjectName = subjectDoc?.code || subjectDoc?.name || 'Unknown Subject'
  const name = `${gradeName}-${subjectName}-${data.year}-${data.label || 'Exam'}`

  // Convert file → buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload directly to Google Drive
  const driveResult = await uploadToDrive({
    buffer,
    filename: name,
    mimeType: file.type,
    year: data.year,
    grade: gradeName,
    subject: subjectName,
  })

  // Save metadata in Payload
  const exam = await payload.create({
    collection: 'exams',
    data: {
      title: data.title || '',
      grade: data.grade,
      subject: data.subject,
      label: data.label,
      year: data.year,

      filename: file.name,
      mimeType: file.type,
      filesize: file.size,

      driveUrl: driveResult.url,
      driveFileId: driveResult.fileId,
    },
  })

  return NextResponse.json({
    success: true,
    exam,
  })
}
