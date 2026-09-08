import { NextResponse } from 'next/server'

import { reviewExam } from '@/lib/exams/reviewExam'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params

    const result = await reviewExam(id)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Failed to review exam:', error)

    return NextResponse.json(
      {
        error: 'Failed to review exam',
      },
      {
        status: 500,
      },
    )
  }
}
