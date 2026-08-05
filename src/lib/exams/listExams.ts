import { getPayload } from 'payload'
import config from '@payload-config'

export async function listExams() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'exams',
    depth: 2,
    limit: 1000,
    sort: '-updatedAt',
  })

  return result.docs
}
