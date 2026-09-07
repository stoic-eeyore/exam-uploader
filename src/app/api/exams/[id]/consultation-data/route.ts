import { NextResponse } from 'next/server'

import { getExamConsultationData } from '@/lib/exams/getExamConsultationData'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const data = await getExamConsultationData(id)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to generate exam consultation data:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate exam consultation data',
      },
      {
        status: 500,
      },
    )
  }
}
