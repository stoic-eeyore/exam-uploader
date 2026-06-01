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

  if (!question.suggestedQuestionText) {
    return NextResponse.json(
      {
        error: 'No suggestion exists',
      },
      {
        status: 400,
      },
    )
  }

  await payload.update({
    collection: 'questions',
    id,
    data: {
      questionText: question.suggestedQuestionText,

      questionType: question.suggestedQuestionType,

      options: question.suggestedOptions || [],

      suggestedQuestionText: null,
      suggestedQuestionType: null,
      suggestedOptions: [],
      suggestedInstructions: null,
    },
  })

  return NextResponse.json({
    success: true,
  })
}
