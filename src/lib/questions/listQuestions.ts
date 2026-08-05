import { getPayload } from 'payload'
import config from '@payload-config'
import { Where } from 'payload'
import { mapQuestionListItem } from './mapQuestionListItem'

interface ListQuestionsOptions {
  page?: number
  limit?: number

  grade?: number
  subject?: number
}

export async function listQuestions({
  page = 1,
  limit = 50,
  grade,
  subject,
}: ListQuestionsOptions = {}) {
  const payload = await getPayload({ config })

  const where: Where = {}

  if (grade) {
    where['exam.grade'] = {
      equals: grade,
    }
  }

  if (subject) {
    where['exam.subject'] = {
      equals: subject,
    }
  }

  const result = await payload.find({
    collection: 'questions',
    depth: 2,
    page: page,
    limit: limit,
    where,
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
