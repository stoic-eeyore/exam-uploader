'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { QuestionFormData } from './types'

export async function createQuestion(data: QuestionFormData) {
  const payload = await getPayload({ config })

  return payload.create({
    collection: 'questions',
    data: {
      origin: 'manual',
      status: 'draft',

      editedByHuman: true,
      reviewedByAI: false,

      grade: data.grade,
      subject: data.subject,

      questionType: data.questionType,
      questionText: data.questionText,

      options: data.options,
      images: data.images,
    },
  })
}
