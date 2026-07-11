import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import config from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<any>; user: any; payload: any }
) => Promise<Response>

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, { params }: { params: Promise<any> }) => {
    // Authenticate via NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Find or create Payload user from NextAuth session
    const payloadUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
    })

    let user = payloadUsers.docs[0]

    if (!user) {
      user = await payload.create({
        collection: 'users',
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
        },
      })
    }

    return handler(req, { params, user, payload })
  }
}

