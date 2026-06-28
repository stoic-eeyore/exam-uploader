import { BasePayload } from 'payload'
import { getDriveFileAsPdf } from '@/lib/googleDrive'

interface GetActiveFileParams {
  payload: BasePayload
  driveUrl: string
  mimeType: string
  filename: string
}

interface GeminiFileRef {
  name: string
  mimeType?: string
  uri: string
}

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

export async function getActiveGeminiFile({
  payload,
  driveUrl,
  mimeType,
  filename,
}: GetActiveFileParams): Promise<GeminiFileRef> {
  console.log('Checking for active Gemini file mapping for driveUrl:', driveUrl)
  // 1. Query your Payload Postgres Database cache
  const mappingResult = await payload.find({
    collection: 'gemini-mappings',
    where: {
      driveUrl: { equals: driveUrl },
    },
    limit: 1,
  })

  const mapping = mappingResult.docs[0] // Pull the first record out safely
  const SAFETY_BUFFER_MS = 5 * 60 * 1000 // 5-minute safety window

  const isExpired = mapping
    ? new Date(mapping.geminiExpiresAt).getTime() - SAFETY_BUFFER_MS < Date.now()
    : true

  // ✅ Cache Hit: File is confirmed alive on Google's API server. Reuse it immediately!
  if (mapping && !isExpired) {
    return {
      name: mapping.geminiFileName,
      uri: mapping.geminiFileUri,
    }
  }

  console.log('No active Gemini file mapping found. Uploading new file to Gemini.')
  // ❌ Cache Miss: Execute the lazy buffer-fetching callback function passed into the helper
  const downloadResult = await getDriveFileAsPdf(driveUrl)

  // Swap the extension name out for your Gemini file registration name if it was converted
  const finalFilename = filename.replace(/\.docx$/i, '.pdf')

  // Execute your manual buffer fetch upload tool defined above
  console.log(
    'Uploading file to Gemini...' +
      `Filename: ${filename}, MimeType: ${mimeType}, BufferSize: ${downloadResult.buffer.length} bytes`,
  )
  const uploadedFile = await uploadFileToGemini({
    buffer: downloadResult.buffer,
    mimeType: downloadResult.mimeType,
    filename: finalFilename,
  })
  const nativeExpiry = new Date(uploadedFile.expirationTime).toISOString()

  console.log('File uploaded to Gemini. Syncing mapping back to Payload Postgres cache...', {
    driveUrl,
    geminiFileName: uploadedFile.name,
    geminiFileUri: uploadedFile.uri,
    geminiExpiresAt: nativeExpiry,
  })
  // 2. Sync changes back into your Postgres instance via Payload Local API
  if (mapping) {
    await payload.update({
      collection: 'gemini-mappings',
      id: mapping.id,
      data: {
        geminiFileName: uploadedFile.name,
        geminiFileUri: uploadedFile.uri,
        geminiExpiresAt: nativeExpiry,
      },
    })
  } else {
    await payload.create({
      collection: 'gemini-mappings',
      data: {
        driveUrl,
        geminiFileName: uploadedFile.name,
        geminiFileUri: uploadedFile.uri,
        geminiExpiresAt: nativeExpiry,
      },
    })
  }

  return {
    mimeType: uploadedFile.mimeType,
    name: uploadedFile.name,
    uri: uploadedFile.uri,
  }
}
