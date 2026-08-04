import { getPayload } from 'payload'
import config from '@payload-config'

import { mapQuestionDetail } from './mapQuestionDetail'

export async function getQuestion(id: number) {
  const payload = await getPayload({ config })

  const question = await payload.findByID({
    collection: 'questions',
    id,
    depth: 2,
  })

  return mapQuestionDetail(question)
}
