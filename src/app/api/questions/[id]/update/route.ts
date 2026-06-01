import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const body = await req.json()

  const payload = await getPayload({
    config,
  })

  await payload.update({
    collection: 'questions',
    id,
    data: {
      questionText: body.questionText,
      questionType: body.questionType,
      options: body.options,
      editedByHuman: true,
    },
  })

  return NextResponse.json({
    success: true,
  })
}
