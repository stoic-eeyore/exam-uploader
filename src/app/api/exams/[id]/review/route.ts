import { NextResponse } from 'next/server'
import { reviewExamQuestions } from '@/lib/reviewExamQuestions'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  await reviewExamQuestions(id)

  return NextResponse.json({
    success: true,
  })
}

