import { getPayload } from 'payload'
import config from '@payload-config'

export async function listSubjects() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'subjects',
    limit: 100,
    sort: 'name',
  })

  return result.docs
}
