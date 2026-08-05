import { getPayload } from 'payload'
import config from '@payload-config'

export async function listGrades() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'grades',
    limit: 100,
    sort: 'name',
  })

  return result.docs
}
