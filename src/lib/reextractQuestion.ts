import config from '@payload-config'
import { getPayload } from 'payload'
import { getActiveGeminiFile } from './geminiFiles'
import { extractJson } from '@/utils/json'
import { geminiModel } from '@/lib/gemini'

export async function reextractQuestion(questionId: string, instructions: string) {
  const payload = await getPayload({
    config,
  })

  const question = await payload.findByID({
    collection: 'questions',
    id: questionId,
  })

  if (!question) {
    throw new Error('Question not found')
  }

  const examId =
    typeof question.exam === 'object' && question.exam !== null ? question.exam.id : question.exam

  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam || !exam.driveUrl) {
    throw new Error('Exam not found')
  }

  const uploadedFile = await getActiveGeminiFile({
    payload,
    driveUrl: exam.driveUrl,
    mimeType: exam.mimeType || 'application/pdf',
    filename: exam.filename || 'exam.pdf',
  })

  const result = await geminiModel.generateContent([
    {
      fileData: {
        mimeType: uploadedFile.mimeType!,
        fileUri: uploadedFile.uri!,
      },
    },
    {
      text: `
The attached PDF is an academic exam.

[TARGET TASK]
Your sole objective is to re-extract and re-format Question ${question.questionNumber} from this document, while strictly incorporating the custom request provided in the [ADDITIONAL INSTRUCTIONS] section below.

[CONTEXT ENVIRONMENT]
- Target Question: Question ${question.questionNumber}
- Strategy: You may inspect preceding and succeeding questions to understand local context, reading flow, or shared table references. 
- Output Boundary: You must ONLY return the data for Question ${question.questionNumber}. Do not bundle adjacent questions into the JSON.

[ADDITIONAL INSTRUCTIONS - HIGH PRIORITY]
${instructions}

[CORE FORMATTING CONSTRAINTS]
1. Chemistry & Math: All chemical formulas, reactions, subscripts, superscripts, or math notations MUST be wrapped in single dollar signs ($...$). 
   - Write subscripts with underscores (e.g., $H_2O$, $C_6H_{12}O_6$).
   - Write charges/superscripts with carets (e.g., $SO_4^{2-}$, $OH^-$).
2. Math Operations: Use standard LaTeX formatting for equations, fractions ($\frac{a}{b}$), and roots ($\sqrt{x}$).
3. Tables: If the target question references a table, you MUST extract the table in its entirety. Do not drop rows. Convert it into a structured, clean markdown text table embedded right inside the "questionText" property.

[JSON OUTPUT SCHEMA SPECIFICATION]
Return a single JSON object matching this exact shape. Do not change the key names:
{
  "questionNumber": ${question.questionNumber},
  "questionType": "mcq", // Must be strictly "mcq" or "essay"
  "confidence": 95, // Integer from 0 to 100
  "questionText": "Based on the reaction table below:\n\n| Reactant | Product |\n|---|---|\n| $H_2$ | $H_2O$ |\n\nWhich compound represents the oxidized agent?",
  "choices": [
    { "key": "A", "text": "Text for option A" },
    { "key": "B", "text": "Text for option B" },
    { "key": "C", "text": "Text for option C" },
    { "key": "D", "text": "Text for option D" }
  ]
}
Note: If the question type is "essay", the "choices" array must be completely empty ([]).

[SYSTEM GUARDRAILS]
- Do not add conversational text introduction or sign-offs.
- Return raw, valid, minified JSON only.
`,
    },
  ])

  const text = result.response.text()
  console.log('Gemini response:', text)
  const cleaned = extractJson(text)
  const parsed = JSON.parse(cleaned)

  await payload.update({
    collection: 'questions',
    id: question.id,
    data: {
      aiRawResponse: text,
      suggestedQuestionText: parsed.questionText,
      suggestedQuestionType: parsed.questionType,

      suggestedOptions: parsed.choices?.map((choice: any) => ({
        text: choice.text,
      })),
    },
  })
}
