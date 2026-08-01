import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    console.log('Received verify request with body:', body)
    const { label, year, grade, subject, semester } = body

    // Validate required fields (pendingExamId no longer needed since we have id from params)
    const requiredFields = { label, year, grade, subject }
    for (const [key, value] of Object.entries(requiredFields)) {
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

    const [gradeDoc, subjectDoc, pendingExam] = await Promise.all([
      payload.findByID({ collection: 'grades', id: grade }),
      payload.findByID({ collection: 'subjects', id: subject }),
      payload.findByID({ collection: 'pending-exams', id }),
    ])

    if (!subjectDoc || !gradeDoc) {
      return NextResponse.json(
        { error: 'Specified Subject or Grade record not found' },
        { status: 404 },
      )
    }

    console.log('Found gradeDoc:', gradeDoc)
    console.log('Found subjectDoc:', subjectDoc)

    if (!pendingExam) {
      return NextResponse.json({ error: 'Pending exam not found' }, { status: 404 })
    }

    console.log('Found pendingExam:', pendingExam.aiAnalysis)

    // Merge existing aiAnalysis with new form data
    const mergedAiAnalysis = {
      ...(pendingExam.aiAnalysis || {}),
      label,
      year,
      gradeId: gradeDoc.id,
      gradeName: gradeDoc.name,
      subjectId: subjectDoc.id,
      subjectName: subjectDoc.name,
      semester: semester || null,
      // Preserve any other fields that existed in the original aiAnalysis
      // e.g. confidence, rawResponse, extractedText, etc.
    }

    console.log('Merged AI Analysis:', mergedAiAnalysis)

    // Update the pending exam with merged AI analysis + isVerified flag
    const updated = await payload.update({
      collection: 'pending-exams',
      id,
      data: {
        aiAnalysis: mergedAiAnalysis,
        status: 'verified',
      },
    })

    return NextResponse.json({
      success: true,
      pendingExam: updated,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to verify exam' }, { status: 500 })
  }
}
