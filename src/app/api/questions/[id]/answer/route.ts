import { withAuth } from '@/lib/with-auth'
import { answerSingleQuestion } from '@/lib/questions/answerQuestion'
import { NextResponse } from 'next/server'

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
