import { BasePayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { getActiveGeminiFile } from '@/lib/geminiFiles'
import { extractJson } from '@/utils/json'

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

  console.log(`[analyzePendingExam] Sending request to Gemini for exam ${examId}`)
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
Also, 'IV' corresponds to Primary 4, 'VII' corresponds to 'Secondary 1' and 'XI' corresponds to Secondary 5 and so on.
3. What is the year (look for 'Tahun Ajaran' or similar) of the exam? (e.g. 2024/2026, 2024/2025, etc.)
4. What is the label of the exam? (Sumatif 1 to Sumatif 6, Formatif 1 to Formatif 6)
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
  "numberEssayQuestions": "integer"
}
`,
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
