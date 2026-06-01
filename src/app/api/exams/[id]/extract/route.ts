import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { extractExamQuestions } from '@/lib/examExtraction'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({
    config,
  })

  const { id } = await params

  const exam = await extractExamQuestions(id)

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    examId: id,
  })
}
