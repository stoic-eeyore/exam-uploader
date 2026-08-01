import { BasePayload } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { organizeInDrive } from '@/lib/googleDrive'
import { generateExamFilename } from '@/utils/exam'

// ─── Internal shared core ─────────────────────────────────────────────

async function executeConversion(
  payload: BasePayload,
  pendingExamId: string | number,
  label: string,
  year: string,
  grade: string | number,
  subject: string | number,
) {
  const [gradeDoc, subjectDoc, pendingExam] = await Promise.all([
    payload.findByID({ collection: 'grades', id: grade }),
    payload.findByID({ collection: 'subjects', id: subject }),
    payload.findByID({ collection: 'pending-exams', id: pendingExamId }),
  ])

  if (!gradeDoc || !subjectDoc) {
    throw new Error('Specified Subject or Grade record not found')
  }

  if (!pendingExam) {
    throw new Error('Pending exam not found')
  }

  const gradeName = gradeDoc.code || 'xxx'
  const subjectName = subjectDoc.code || 'xxx'
  const newFileName = generateExamFilename(gradeName, subjectName, year, label)

  await organizeInDrive(
    pendingExam.driveFileId,
    process.env.GOOGLE_DRIVE_DROPBOX_FOLDER_ID!,
    year,
    gradeName,
    subjectName,
    newFileName,
  )

  const exam = await payload.create({
    collection: 'exams',
    data: {
      title: pendingExam.filename,
      label,
      year: year as any,
      grade: Number(grade),
      subject: Number(subject),
      driveUrl: pendingExam.driveUrl,
      driveFileId: pendingExam.driveFileId,
      fileHash: pendingExam.fileHash,
    },
  })

  await payload.update({
    collection: 'pending-exams',
    id: pendingExam.id,
    data: { status: 'processed', processed: true },
  })

  return { success: true, exam }
}

// ─── Manual conversion (used by /api/convert-pending-exam) ───────────

export async function convertPendingExam(params: {
  pendingExamId: string | number
  label: string
  year: string
  grade: string | number
  subject: string | number
}) {
  const { pendingExamId, label, year, grade, subject } = params
  const payload = await getPayloadClient()
  return executeConversion(payload, pendingExamId, label, year, grade, subject)
}

// ─── Auto conversion (used by cron) ───────────────────────────────────

export async function convertVerifiedExam(payload: BasePayload, pendingExamId: string | number) {
  const pendingExam = await payload.findByID({
    collection: 'pending-exams',
    id: pendingExamId,
  })

  if (!pendingExam) {
    throw new Error('Pending exam not found')
  }

  const ai = (pendingExam as any).aiAnalysis as
    | {
        label?: string
        year?: string
        gradeId?: string | number
        subjectId?: string | number
      }
    | undefined

  if (!ai) {
    throw new Error('No AI analysis found for this pending exam')
  }

  const { label, year, gradeId, subjectId } = ai
  const required = { label, year, gradeId, subjectId }

  for (const [key, value] of Object.entries(required)) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      throw new Error(`AI analysis missing required field: ${key}`)
    }
  }

  return executeConversion(payload, pendingExamId, label!, year!, gradeId!, subjectId!)
}
