import { getPayloadClient } from '@/lib/payload'

export async function syncUser(user: { email?: string | null; name?: string | null }) {
  if (!user.email) return null

  const payload = await getPayloadClient()

  // Check if user already exists
  const existing = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: user.email,
      },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0]
  }

  // Create user
  return await payload.create({
    collection: 'users',
    data: {
      email: user.email,
      name: user.name || user.email,
      password: Math.random().toString(36),
      role: 'teacher',
    },
  })
}
