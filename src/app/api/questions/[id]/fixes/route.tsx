import { withAuth } from '@/lib/with-auth'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withAuth(async (req, { params, user, payload }) => {
  const { id } = await params
  const body = await req.json()

  // If body has `note`, append a new fix
  // If body has `fixes`, replace the whole array (for removes)
  let updatedFixes: any[]

  if (body.note) {
    const question = await payload.findByID({
      collection: 'questions',
      id,
    })

    const existing = question.fixes || []
    updatedFixes = [
      ...existing,
      {
        note: body.note,
        fixedBy: user.id,
        fixedAt: new Date().toISOString(),
      },
    ]
  } else if (Array.isArray(body.fixes)) {
    updatedFixes = body.fixes
  } else {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const updated = await payload.update({
    collection: 'questions',
    id,
    data: { fixes: updatedFixes },
    overrideAccess: true,
    user,
    depth: 2,
  })

  return NextResponse.json(updated)
})

