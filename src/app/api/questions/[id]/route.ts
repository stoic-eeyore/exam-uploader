import { NextRequest, NextResponse } from 'next/server'

import { getQuestion } from '@/lib/questions/getQuestion'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const question = await getQuestion(Number(id))

  return NextResponse.json(question)
}
