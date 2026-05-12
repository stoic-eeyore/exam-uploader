import { GoogleAIFileManager } from '@google/generative-ai/server'

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!)

export async function uploadFileToGemini({
  buffer,
  mimeType,
  filename,
}: {
  buffer: Buffer
  mimeType: string
  filename: string
}) {
  const formData = new FormData()

  const blob = new Blob([buffer], {
    type: mimeType,
  })

  formData.append('file', blob, filename)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const text = await response.text()

    throw new Error(`Gemini upload failed: ${text}`)
  }

  const json = await response.json()

  return json.file
}
