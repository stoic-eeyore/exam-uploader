import { NextResponse } from 'next/server'
import { google } from 'googleapis'

import { genAI, geminiModel } from '@/lib/gemini'
import { getPayloadClient } from '@/lib/payload'
import { downloadDriveFile } from '@/lib/googleDrive'
import { getActiveGeminiFile, uploadFileToGemini } from '@/lib/geminiFiles'
import { extractJson } from '@/utils/json'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadClient()
    const body = await req.json()
    const examId = body.examId

    if (!examId) {
      return NextResponse.json({ error: 'Missing pendingExamId' }, { status: 400 })
    }

    // Load exam
    const exam = await payload.findByID({
      collection: 'pending-exams',
      id: examId,
    })

    if (!exam.driveUrl) {
      return NextResponse.json({ error: 'PendingExam has no driveUrl' }, { status: 400 })
    }

    //const buffer = await downloadDriveFile(exam.driveUrl)

    console.log('uploading file to Gemini')
    const uploadedFile = await getActiveGeminiFile({
      payload,
      driveUrl: exam.driveUrl,
      mimeType: exam.mimeType || 'application/pdf',
      filename: exam.filename || 'exam.pdf',
    })

    // 1. Fetch your current database option rows from Postgres
    const subjectsDb = await payload.find({
      collection: 'subjects',
      limit: 200,
    })

    // Assumes your collection slug is named 'grade-levels'
    const gradesDb = await payload.find({
      collection: 'grades',
      limit: 200,
    })

    // 2. Format the data rows into a clean context list for the AI string
    const formattedSubjects = subjectsDb.docs
      .map((s: any) => `- ID: ${s.id}, Name: "${s.name}"`)
      .join('\n')

    const formattedGrades = gradesDb.docs
      .map((g: any) => `- ID: ${g.id}, Name: "${g.name}"`)
      .join('\n')

    // Send to Gemini
    console.log('Sending request to Gemini here')
    const result = await geminiModel.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.mimeType!,
          fileUri: uploadedFile.uri!,
        },
      },
      {
        text: `
    The file included is an exam file.

    Can you help determine the following:
    1. What is the subject (look for 'Mata Pelajaran' or similar) of the exam? (e.g. Math, Physics). And the corresponding subject ID.
    2. What is the grade (look for 'Kelas' or similar) of the exam? (e.g. Primary 1 to Primary 6, Secondary 1 to Secondary 6). And the corresponding grade ID.
    Also, 'IV' corresponds to Primary 4, 'VII" corresponds to 'Secondary 1' and 'XI' corresponds to Secondary 5 and so on.
    3. What is the year (look for 'Tahun Ajaran' or similar) of the exam? (e.g. 2024/2026, 2024/2025, etc.)
    4. What is the label of the exam? (Sumatif 1 to Sumatif 6, Formatif 1 toFormatif 6)
    5. The number of multiple choice questions and the number of essay questions in the exam.

    Here is the list of subjects: 
    ${formattedSubjects || 'No subjects currently configured.'}

    Here is the list of grade levels:
    ${formattedGrades || 'No grade levels currently configured.'} 

    Return ONLY valid JSON in this format:
    {
      "subjectName": "string",
      "subjectId": "integer",
      "gradeName": "string",
      "gradeId": "integer",
      "year": "string",
      "label": "string",
      "numberMultipleChoiceQuestions": "integer",
      "numberEssayQuestions": "integer",
    }
    `,
      },
    ])

    const text = result.response.text()
    const aiRawResponse = extractJson(text)
    console.log('Gemini response:', aiRawResponse)
    const aiAnalysis = JSON.parse(aiRawResponse)

    // Save result
    await payload.update({
      collection: 'pending-exams',
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
