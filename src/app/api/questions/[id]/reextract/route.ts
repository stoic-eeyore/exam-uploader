import { reextractQuestion } from '@/lib/reextractQuestion'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const body = await req.json()

  await reextractQuestion(id, body.instructions || '')

  return NextResponse.json({
    success: true,
  })
}
