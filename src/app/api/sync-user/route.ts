import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import config from '@payload-config'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const email = session.user.email
  const payload = await getPayloadClient()

  // Check if user exists
  const existing = await payload.find({
    collection: 'users',
    where: {
      email: { equals: email },
    },
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email,
        password: Math.random().toString(36),
        role: 'teacher',
      },
    })
  }

  return Response.json({ success: true })
}
