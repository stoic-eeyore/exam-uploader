import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { analyzePendingExam } from '@/lib/analyzePendingExam'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadClient()
    const body = await req.json()
    const examId = body.examId

    if (!examId) {
      return NextResponse.json({ error: 'Missing pendingExamId' }, { status: 400 })
    }

    // Load exam
    const exam = await payload.findByID({
      collection: 'pending-exams',
      id: examId,
    })

    if (!exam.driveUrl) {
      return NextResponse.json({ error: 'PendingExam has no driveUrl' }, { status: 400 })
    }

    const { aiAnalysis } = await analyzePendingExam(payload, examId)

    return NextResponse.json({
      success: true,
      aiAnalysis,
    })
  } catch (err) {
    console.error('[api/analyze-pending-exam] Error analyzing pending exam:', err)

    return NextResponse.json({ error: 'Failed to analyze exam' }, { status: 500 })
  }
}
