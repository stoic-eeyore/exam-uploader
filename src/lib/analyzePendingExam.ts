import { BasePayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { getActiveGeminiFile } from '@/lib/geminiFiles'
import { extractJson } from '@/utils/json'
import fs from 'node:fs'
import path from 'node:path'

const template = fs.readFileSync(path.join(process.cwd(), 'src/prompts/classifyExam.md'), 'utf8')

export async function analyzePendingExam(payload: BasePayload, examId: string) {
  const exam = await payload.findByID({
    collection: 'pending-exams',
    id: examId,
  })

  if (!exam.driveUrl) {
    throw new Error('PendingExam has no driveUrl')
  }

  console.log(`[analyzePendingExam] Uploading file to Gemini for exam ${examId}`)
  const uploadedFile = await getActiveGeminiFile({
    payload,
    driveUrl: exam.driveUrl,
    mimeType: exam.mimeType || 'application/pdf',
    filename: exam.filename || 'exam.pdf',
  })

  const subjectsDb = await payload.find({
    collection: 'subjects',
    limit: 200,
  })

  const gradesDb = await payload.find({
    collection: 'grades',
    limit: 200,
  })

  const formattedSubjects = subjectsDb.docs
    .map((s: any) => `- ID: ${s.id}, Name: "${s.name}"`)
    .join('\n')

  const formattedGrades = gradesDb.docs
    .map((g: any) => `- ID: ${g.id}, Name: "${g.name}"`)
    .join('\n')

  const prompt = template
    .replace('{{subjects}}', formattedSubjects)
    .replace('{{grades}}', formattedGrades)
  console.log(`[analyzePendingExam] Prompt for exam ${examId}:`, prompt)

  console.log(`[analyzePendingExam] Sending request to Gemini for exam ${examId}`)
  const result = await geminiModel.generateContent([
    {
      fileData: {
        mimeType: uploadedFile.mimeType!,
        fileUri: uploadedFile.uri!,
      },
    },
    {
      text: prompt,
    },
  ])

  const text = result.response.text()
  const aiRawResponse = extractJson(text)
  console.log(`[analyzePendingExam] Gemini response for exam ${examId}:`, aiRawResponse)

  const aiAnalysis = JSON.parse(aiRawResponse)

  await payload.update({
    collection: 'pending-exams',
    id: examId,
    data: {
      aiAnalysis,
    },
  })

  return { aiAnalysis }
}
