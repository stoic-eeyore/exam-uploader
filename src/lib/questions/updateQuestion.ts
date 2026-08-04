import { getPayload } from 'payload'
import config from '@payload-config'

import type { QuestionFormData } from './types'

export async function updateQuestion(
  id: number,
  data: {
    questionText: string | null
    questionType: 'mcq' | 'essay'
    options: { text: string | null }[]
    images: {
      url: string
      placement: 'auto' | 'right'
      width: number | null
    }[]
  },
) {
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
