import { withAuth } from '@/lib/with-auth'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withAuth(async (req, { params, user, payload }) => {
  const { id } = await params

  // Get current question state
  const question = await payload.findByID({
    collection: 'questions',
    id,
  })

  const isCurrentlyVerified = question.status === 'verified'
  const newStatus = isCurrentlyVerified ? 'draft' : 'verified'

  const updateData: any = { status: newStatus }

  if (newStatus === 'verified') {
    updateData.verifiedBy = user.id
    updateData.verifiedAt = new Date().toISOString()
  } else {
    updateData.verifiedBy = null
    updateData.verifiedAt = null
  }

  const updated = await payload.update({
    collection: 'questions',
    id,
    data: updateData,
    overrideAccess: true,
    user,
  })

  return NextResponse.json(updated)
})

