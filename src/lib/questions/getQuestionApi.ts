import type { Question } from '@/payload-types'

export async function getQuestionApi(id: number): Promise<Question> {
  const res = await fetch(`/api/questions/${id}`)

  if (!res.ok) {
    throw new Error('Failed to load question')
  }

  return res.json()
}
