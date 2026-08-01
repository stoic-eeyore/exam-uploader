import { NextRequest, NextResponse } from 'next/server'
import { convertPendingExam } from '@/lib/examConversion'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pendingExamId, label, year, grade, subject } = body

    const required = { pendingExamId, label, year, grade, subject }
    for (const [key, value] of Object.entries(required)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        return NextResponse.json(
          { error: `Missing or empty required field: ${key}` },
          { status: 400 },
        )
      }
    }

    const result = await convertPendingExam({ pendingExamId, label, year, grade, subject })
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Failed to convert exam'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
