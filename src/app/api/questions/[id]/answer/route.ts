import { withAuth } from '@/lib/with-auth'
import { answerSingleQuestion } from '@/lib/questions/answerQuestion'
import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export const POST = withAuth(async (req, { params }) => {
  const { id } = await params

  try {
    const question = await answerSingleQuestion(id)

    return NextResponse.json(question)
  } catch (error) {
    console.error(`[api/questions/${id}/answer] Failed:`, error)

    const message = error instanceof Error ? error.message : 'Failed to answer question'

    return NextResponse.json({ error: message }, { status: 500 })
  }
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { answer, explanation } = await req.json()

    const payload = await getPayload({
      config,
    })

    const question = await payload.update({
      collection: 'questions',
      id: Number(id),
      data: {
        answer: answer || null,
        explanation: explanation || null,
      },
    })

    return Response.json({
      answer: question.answer,
      explanation: question.explanation,
    })
  } catch (error) {
    console.error('Failed to update answer:', error)

    return new Response(error instanceof Error ? error.message : 'Failed to update answer', {
      status: 500,
    })
  }
}
