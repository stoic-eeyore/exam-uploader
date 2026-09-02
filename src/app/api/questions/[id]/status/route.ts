import { withAuth } from '@/lib/with-auth'

import { NextResponse } from 'next/server'

const VALID_STATUSES = ['draft', 'flagged', 'verified'] as const

type QuestionStatus = (typeof VALID_STATUSES)[number]

export const POST = withAuth(async (req, { params, user, payload }) => {
  const { id } = await params

  const body = await req.json()
  const status = body.status as QuestionStatus

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid question status' }, { status: 400 })
  }

  // Get current question
  const question = await payload.findByID({
    collection: 'questions',
    id,
  })

  const updateData: Record<string, any> = {
    status,
  }

  // Only verified questions have verification metadata
  if (status === 'verified') {
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

  // Update exam status based on whether every question is verified
  const examId = typeof question.exam === 'object' ? question.exam.id : question.exam

  if (examId) {
    const allQuestions = await payload.find({
      collection: 'questions',
      where: {
        exam: {
          equals: examId,
        },
      },
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
        data: {
          processingStatus: newExamStatus,
        },
        overrideAccess: true,
        user,
      })
    }
  }

  return NextResponse.json(updated)
})
