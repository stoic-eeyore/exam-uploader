import config from '@payload-config'
import { getPayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { extractJson } from '@/utils/json'
import { getActiveGeminiFile } from './geminiFiles'

export async function reviewExamQuestions(examId: string) {
  const payload = await getPayload({
    config,
  })

  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam || !exam.driveUrl) {
    throw new Error('Exam not found')
  }

  console.log(`Getting exam file ${exam.driveUrl}`)
  const uploadedFile = await getActiveGeminiFile({
    payload,
    driveUrl: exam.driveUrl,
    mimeType: exam.mimeType || 'application/pdf',
    filename: exam.filename || 'exam.pdf',
  })

  console.log(`Starting review for ${exam.id} from Gemini`)
  const result = await geminiModel.generateContent([
    {
      fileData: {
        mimeType: uploadedFile.mimeType!,
        fileUri: uploadedFile.uri!,
      },
    },
    {
      text: `
You are an educational assessment reviewer.

For each question:

1. Classify it as:
   - recall
   - understanding
   - hots

2. Detect quality issues:

Possible issues:
- No clear answer
- Multiple correct answers
- Ambiguous wording
- Grammar issue
- Incomplete question
- Missing context
- Duplicate options
- Option mismatch
- Other

Severity:
- low
- medium
- high

Do not flag minor grammar issues unless they would confuse a student.

Only report issues that materially affect question quality.

Return ONLY JSON.

{
  "questions": [
    {
      "questionNumber": 1,
      "questionType": "mcq", // value must be "mcq" or "essay"
      "cognitiveLevel": "recall",
      "issues": [
        {
          "issue": "Grammar issue",
          "severity": "low"
        }
      ]
    }
  ]
}
`,
    },
  ])

  const text = result.response.text()
  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      aiRawResponse: text,
    },
  })
  const cleaned = extractJson(text)
  const parsed = JSON.parse(cleaned)

  const questions = await payload.find({
    collection: 'questions',
    where: {
      exam: {
        equals: examId,
      },
    },
    limit: 500,
  })

  const questionMap = new Map(
    questions.docs.map((q) => [`${q.questionNumber}_${q.questionType}`, q]),
  )

  console.log(`Parsed review: ${JSON.stringify(parsed)}`)
  for (const review of parsed.questions) {
    const question = questionMap.get(`${review.questionNumber}_${review.questionType}`)

    console.log(
      `Review for question ${review.questionNumber}: ${review.cognitiveLevel}, issues: ${review.issues?.length || 0}`,
    )
    if (!question) continue

    console.log(`Updating question ${question.id} with review results`)
    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        reviewedByAI: true,
        cognitiveLevel: review.cognitiveLevel,
        qualityIssues: review.issues || [],
      },
    })
  }

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      reviewedByAI: true,
    },
  })
}
