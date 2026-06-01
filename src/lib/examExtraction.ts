import config from '@payload-config'
import { getPayload } from 'payload'
import { getActiveGeminiFile } from './geminiFiles'
import { extractJson } from '@/utils/json'
import { geminiModel } from '@/lib/gemini'

export async function extractExamQuestions(examId: string) {
  const payload = await getPayload({
    config,
  })

  // 1. load exam
  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam || !exam.driveUrl) {
    throw new Error('Exam not found')
  }

  // 2. update status
  await payload.update({
    collection: 'exams',
    id: examId,
    data: {
      processingStatus: 'extracting',
    },
  })

  try {
    console.log(`Getting exam file ${exam.driveUrl}`)
    // 3. download pdf
    const uploadedFile = await getActiveGeminiFile({
      payload,
      driveUrl: exam.driveUrl,
      mimeType: exam.mimeType || 'application/pdf',
      filename: exam.filename || 'exam.pdf',
    })

    // 4. extract text
    console.log(`Starting extraction for ${exam.id} from Gemini`)
    const result = await geminiModel.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.mimeType!,
          fileUri: uploadedFile.uri!,
        },
      },
      {
        text: `
You are a precise academic data extraction engine. Extract individual questions from the included exam file.

### TASK STEPS
For every question found in the document, you must perform two steps sequentially in your output:
1. <thinking>: Briefly list the question number, write out any raw chemical/math formulas found, and write down their correct LaTeX translation.
2. <json_output>: Output the final unified JSON array containing all processed questions.

---

### LAYER 1: DATA STRUCTURE RULES
For each question determine:
- questionNumber (integer)
- questionType (mcq or essay)
- questionText
- choices

1. If the question is essay: Set questionType to "essay" and return an empty choices array [].
2. If the question is multiple choice: Set questionType to "mcq" and return all choices.
3. Classification Guardrail: A question MUST ONLY be classified as an "essay" if there are absolutely no multiple-choice choices (e.g., A, B, C, D) matching or answering it anywhere further down the page.
4. Look-Ahead Scanning Rule: Read ahead past tables and secondary text blocks to see if a choices array block exists. If choices exist at the bottom of a block containing a table, the ENTIRE sequence (initial text + table content + secondary text) must be combined and stored together inside the single "questionText" string property.
5. If a question contains a table, convert the table into a clean markdown format within the text. Do not drop rows.

---

### LAYER 2: SCIENTIFIC TYPOGRAPHY RULES (CRITICAL)
Apply these rules uniformly across both the "questionText" and the choices "text" fields:
1. Identify all formulas, equations, subscripts, superscripts, or math notation.
2. Wrap inline formulas, equations, or special values strictly inside single dollar signs (\(...\)).
3. Format chemical elements properly using LaTeX syntax:
   - Use underscores (_) for subscripts. 
   - Use carets (^) for charges and superscripts.
   - Use curly braces {} for multi-character scripts.
4. For math fractions or roots, use classic LaTeX (e.g., \(\frac{1}{2}\) or \(\sqrt{x}\)).

CRITICAL WRONG VS RIGHT EXAMPLES:
- WRONG: H2O  --> RIGHT: \(H_2O\)
- WRONG: C6H12O6 --> RIGHT: \(C_6H_{12}O_{6}\)
- WRONG: SO42- --> RIGHT: \(SO_4^{2-}\)

---

### OUTPUT FORMAT
You must output your response exactly in this layout.

<thinking>
Question 1 has the formula H2O. LaTeX should be $H_2O$.
Question 2 has the formula SO42-. LaTeX should be $SO_4^{2-}$.
</thinking>

<json_output>
{
  "questions": [
    {
      "questionNumber": 1,
      "questionType": "mcq",
      "confidence": 95,
      "questionText": "Based on the reaction table below:\n\n| Reactant | Product |\n|---|---|\n| $H_2$ | $H_2O$ |\n\nWhich compound represents the oxidized agent?",
      "choices": [
        { "key": "A", "text": "Choice containing $H_2SO_4$" },
        { "key": "B", "text": "Choice B" }
      ]
    }
  ]
}
</json_output>
`,
      },
    ])

    // 6. parse json
    const text = result.response.text()
    await payload.update({
      collection: 'exams',
      id: exam.id,
      data: {
        aiRawResponse: text,
      },
    })
    const jsonMatch = extractJson(text).match(/<json_output>([\s\S]*?)<\/json_output>/)
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse structural output' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[1].trim())

    // 7. create questions
    console.log(`Creating questions for exam ${exam.id}`)
    const existingQuestions = await payload.find({
      collection: 'questions',
      where: {
        exam: {
          equals: exam.id,
        },
      },
      limit: 1,
    })

    if (existingQuestions.totalDocs > 1000) {
      throw new Error('Questions already exist for this exam')
    }

    for (const question of parsed.questions) {
      console.log('Choices here:', question.choices)
      await payload.create({
        collection: 'questions',
        data: {
          exam: exam.id,
          questionNumber: question.questionNumber,

          questionType: question.questionType,

          extractionConfidence: question.confidence ?? null,

          questionText: question.questionText,

          options: question.choices.map((choice: any) => ({
            text: choice.text,
          })),

          status: 'draft',
        },
      })
    }

    // 8. update status
    await payload.update({
      collection: 'exams',
      id: exam.id,
      data: {
        processingStatus: 'review',
      },
    })
  } catch (err) {
    console.error(err)

    await payload.update({
      collection: 'exams',
      id: exam.id,
      data: {
        processingStatus: 'failed',
        processingError: (err as Error).message,
      },
    })

    throw err
  }
  return exam
}
