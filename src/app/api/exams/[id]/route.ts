// src/app/api/exams/[id]/route.ts
import { getPayloadClient } from '@/lib/payload'
import { organizeInDrive, getFolderPathIds } from '@/lib/googleDrive'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()

  const currentExam = await payload.findByID({
    collection: 'exams',
    id,
    depth: 2,
  })

  if (!currentExam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  }

  const body = await req.json()
  const { title, year, label, grade, subject } = body

  // Resolve current IDs for comparison
  const currentGradeId =
    typeof currentExam.grade === 'object' ? currentExam.grade?.id : currentExam.grade
  const currentSubjectId =
    typeof currentExam.subject === 'object' ? currentExam.subject?.id : currentExam.subject

  const gradeChanged = grade !== undefined && String(grade) !== String(currentGradeId)
  const subjectChanged = subject !== undefined && String(subject) !== String(currentSubjectId)
  const yearChanged = year !== undefined && year !== currentExam.year

  let driveUrl = currentExam.driveUrl

  // If folder path changed, move file in Drive
  if ((gradeChanged || subjectChanged || yearChanged) && currentExam.driveFileId) {
    try {
      const [newGradeDoc, newSubjectDoc] = await Promise.all([
        payload.findByID({ collection: 'grades', id: grade || currentGradeId }),
        payload.findByID({ collection: 'subjects', id: subject || currentSubjectId }),
      ])

      const newGradeName = newGradeDoc?.code || newGradeDoc?.name || 'Unknown Grade'
      const newSubjectName = newSubjectDoc?.code || newSubjectDoc?.name || 'Unknown Subject'
      const newYear = year || currentExam.year

      const newFileName = `${newGradeName}-${newSubjectName}-${newYear}-${label || currentExam.label || 'Exam'}`

      await organizeInDrive(
        currentExam.driveFileId,
        undefined,
        newYear,
        newGradeName,
        newSubjectName,
        newFileName,
      )

      // Update driveUrl with new file name context (same fileId, new location)
      driveUrl = `https://drive.google.com/file/d/${currentExam.driveFileId}/view`
    } catch (err) {
      console.error('Drive move failed:', err)
      // Don't block Payload update — file stays in old folder, admin can fix manually
    }
  }

  const updated = await payload.update({
    collection: 'exams',
    id,
    data: {
      ...(title !== undefined && { title }),
      ...(year !== undefined && { year }),
      ...(label !== undefined && { label }),
      ...(grade !== undefined && { grade: Number(grade) }),
      ...(subject !== undefined && { subject: Number(subject) }),
      ...(driveUrl !== currentExam.driveUrl && { driveUrl }),
    },
  })

  return NextResponse.json({ success: true, exam: updated })
}
