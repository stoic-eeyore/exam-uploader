import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({
    config,
  })

  const question = await payload.findByID({
    collection: 'questions',
    id,
  })

  await payload.update({
    collection: 'questions',
    id,
    data: {
      suggestedQuestionText: null,
      suggestedQuestionType: null,
      suggestedOptions: [],
    },
  })

  return NextResponse.json({
    success: true,
  })
}
