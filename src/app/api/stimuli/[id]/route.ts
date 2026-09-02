import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({
    config,
  })

  const stimulus = await payload.findByID({
    collection: 'stimuli',
    id,
  })

  return NextResponse.json(stimulus)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const payload = await getPayload({
    config,
  })

  await payload.update({
    collection: 'stimuli',
    id,
    data: {
      content: body.content,
      images: body.images,
    },
  })

  return NextResponse.json({
    success: true,
  })
}
