import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { reviewExam } from '@/lib/exams/reviewExam'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params

    const result = await reviewExam(id)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Failed to review exam:', error)

    return NextResponse.json(
      {
        error: 'Failed to review exam',
      },
      {
        status: 500,
      },
    )
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()

    if (
      !body ||
      typeof body.examReview !== 'object' ||
      body.examReview === null ||
      Array.isArray(body.examReview)
    ) {
      return NextResponse.json({ error: 'Invalid exam review' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const exam = await payload.update({
      collection: 'exams',
      id,
      data: {
        examReview: body.examReview,
      },
    })

    return NextResponse.json({
      success: true,
      examReview: exam.examReview,
    })
  } catch (error) {
    console.error('Failed to update exam review:', error)

    return NextResponse.json({ error: 'Failed to update exam review' }, { status: 500 })
  }
}
