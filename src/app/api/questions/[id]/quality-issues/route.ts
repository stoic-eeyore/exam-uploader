import { withAuth } from '@/lib/with-auth'
import { NextRequest, NextResponse } from 'next/server'

export const PATCH = withAuth(async (req, { params, user, payload }) => {
  const { id } = await params
  const { qualityIssues } = await req.json()

  const updated = await payload.update({
    collection: 'questions',
    id,
    data: { qualityIssues },
    overrideAccess: true,
    user,
  })

  return NextResponse.json(updated)
})

