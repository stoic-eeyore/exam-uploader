import { NextResponse } from 'next/server'
import { google } from 'googleapis'

import { geminiModel } from '@/lib/gemini'
import { getPayloadClient } from '@/lib/payload'
import { downloadDriveFile } from '@/lib/googleDrive'
import { uploadFileToGemini } from '@/lib/geminiFiles'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadClient()

    const body = await req.json()

    const examId = body.examId

    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 })
    }

    // Load exam
    const exam = await payload.findByID({
      collection: 'exams',
      id: examId,
    })

    if (!exam.driveUrl) {
      return NextResponse.json({ error: 'Exam has no driveUrl' }, { status: 400 })
    }

    const buffer = await downloadDriveFile(exam.driveUrl)

    console.log('uploading file to Gemini')
    const uploadedFile = await uploadFileToGemini({
      buffer,
      mimeType: exam.mimeType || 'application/pdf',
      filename: exam.filename || 'exam.pdf',
    })

    // Send to Gemini
    console.log('Sending request to Gemini')
    const result = await geminiModel.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.mimeType!,
          fileUri: uploadedFile.uri!,
        },
      },
      {
        text: `
Assess the exam included. Give a brief assessment.

Return ONLY valid JSON.
`,
      },
    ])

    const text = result.response.text()
    const aiRawResponse = extractJson(text)
    console.log('Gemini response:', aiRawResponse)
    const aiAnalysis = JSON.parse(aiRawResponse)

    // Save result
    await payload.update({
      collection: 'exams',
      id: examId,
      data: {
        aiAnalysis,
        aiRawResponse,
      },
    })

    return NextResponse.json({
      success: true,
      aiAnalysis,
      aiRawResponse,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json({ error: 'Failed to analyze exam' }, { status: 500 })
  }
}

function extractJson(text: string) {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
}
