import type { QuestionDetail } from './types'

export interface UpdateQuestionRequest {
  questionText: string
  questionType: 'mcq' | 'essay'

  options: {
    text: string | null
  }[]

  images: {
    url: string
    placement: 'auto' | 'right' | 'top' | 'inline'
    width: number
  }[]
}

export async function updateQuestionApi(id: number, data: UpdateQuestionRequest) {
  const response = await fetch(`/api/questions/${id}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update question')
  }
}
