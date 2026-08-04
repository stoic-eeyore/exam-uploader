import { NextRequest, NextResponse } from 'next/server'
import { listQuestions } from '@/lib/questions/listQuestions'

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get('page')) || 1

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 50

  const result = await listQuestions({
    page,
    limit,
  })

  return NextResponse.json(result)
}
