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

  // After updating the question...

  const examId = typeof question.exam === 'object' ? question.exam.id : question.exam

  const allQuestions = await payload.find({
    collection: 'questions',
    where: { exam: { equals: examId } },
    limit: 500,
  })

  const allVerified = allQuestions.docs.every((q: any) => q.status === 'verified')

  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  let newExamStatus = exam.processingStatus

  if (allVerified && exam.processingStatus === 'review') {
    newExamStatus = 'completed'
  } else if (!allVerified && exam.processingStatus === 'completed') {
    newExamStatus = 'review'
  }

  if (newExamStatus !== exam.processingStatus) {
    await payload.update({
      collection: 'exams',
      id: examId,
      data: { processingStatus: newExamStatus },
      overrideAccess: true,
      user,
    })
  }

  return NextResponse.json(updated)
})
