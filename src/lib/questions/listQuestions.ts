import { getPayload } from 'payload'
import config from '@payload-config'
import { mapQuestionListItem } from './mapQuestionListItem'

interface ListQuestionsOptions {
  page?: number
  limit?: number
}

export async function listQuestions({ page = 1, limit = 50 }: ListQuestionsOptions = {}) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'questions',
    depth: 2,
    page,
    limit,
    sort: '-updatedAt',
  })

  return {
    questions: result.docs.map(mapQuestionListItem),

    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.totalDocs,
      totalPages: result.totalPages,
    },
  }
}
