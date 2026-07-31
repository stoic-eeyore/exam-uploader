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
    const text = exam.aiRawResponse || (await queryGemini(payload, exam))

    // 6. parse json
    console.log(`Parsing Gemini output for exam ${exam.id}`)
    const parsed = JSON.parse(extractJson(text))

    // 7. Create stimuli (no type field)
    console.log(`Creating ${parsed.stimuli?.length || 0} stimuli for exam ${exam.id}`)
    const stimulusIdMap = new Map<number, number>()

    if (parsed.stimuli && Array.isArray(parsed.stimuli)) {
      for (const stim of parsed.stimuli) {
        console.log(`Creating stimulus ${stim.stimulusNumber} for exam ${exam.id}`)
        const created = await payload.create({
          collection: 'stimuli',
          data: {
            exam: exam.id,
            stimulusNumber: stim.stimulusNumber,
            content: stim.content,
            images: [], // Gemini can't generate image URLs from a PDF; populate later
            status: 'active',
          },
        })
        stimulusIdMap.set(stim.stimulusNumber, created.id)
      }
    }

    // 8. Create questions
    console.log(`Creating ${parsed.questions?.length || 0} questions for exam ${exam.id}`)
    for (const question of parsed.questions) {
      const stimulusId = question.stimulusNumber
        ? (stimulusIdMap.get(question.stimulusNumber) ?? null)
        : null

      await payload.create({
        collection: 'questions',
        data: {
          exam: exam.id,
          stimulus: stimulusId, // now a relationship, not text
          questionNumber: question.questionNumber,
          questionType: question.questionType,
          extractionConfidence: question.confidence ?? null,
          questionText: question.questionText,
          options:
            question.choices?.map((choice: any) => ({
              text: choice.text,
            })) ?? [],
          status: 'draft',
        },
      })
    }

    // 9. update status
    console.log(`Extraction complete for exam ${exam.id}, updating status to 'review'`)
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

async function queryGemini(payload: any, exam: any) {
  console.log(`Getting exam file ${exam.driveUrl}`)
  // 3. download pdf
  const uploadedFile = await getActiveGeminiFile({
    payload,
    driveUrl: exam.driveUrl || '',
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
You are a precise academic data extraction engine. Extract shared stimuli and individual questions from the included exam file.

### LAYER 0: STIMULUS EXTRACTION
Before extracting questions, scan the entire document and identify all shared stimuli.
A stimulus is any material (passage, table, diagram, experimental setup) that is explicitly shared by MULTIPLE questions.

For each stimulus, extract:
- stimulusNumber: integer starting from 1
- content: The full text/content of the stimulus with LaTeX formatting applied. Convert any tables to clean markdown. Describe any diagrams in words.

Guardrails:
1. If a block of text/images/tables is referred to by only ONE question, do NOT create a stimulus. Embed that content directly inside that single question's questionText instead.
2. Apply ALL scientific typography rules (Layer 2) to stimulus content too.

### LAYER 1: QUESTION DATA STRUCTURE
For each question determine:
- stimulusNumber: integer or null (use null for standalone questions)
- questionNumber: integer
- questionType: "mcq" or "essay"
- questionText
- choices

1. If essay: questionType = "essay", choices = []
2. If multiple choice: questionType = "mcq", return all choices.
3. Classification Guardrail: A question MUST ONLY be "essay" if there are absolutely no multiple-choice options (A, B, C, D) matching it anywhere on the page.
4. Look-Ahead Scanning Rule: Read past tables and secondary text blocks. If choices exist at the bottom of a block containing a table, the ENTIRE sequence (initial text + table content + secondary text) must be combined into the single "questionText" string.
5. If a standalone question has a private table (not shared), embed it as markdown in questionText.

### LAYER 2: SCIENTIFIC TYPOGRAPHY RULES
Apply uniformly across "questionText", "choices.text", AND "stimuli.content":
1. Identify all formulas, equations, subscripts, superscripts, math notation.
2. Wrap inline formulas strictly inside single dollar signs: $...$
3. Chemical elements: underscores for subscripts, carets for charges/superscripts, curly braces for multi-character scripts.
4. Math fractions/roots: use classic LaTeX (\frac{}, \sqrt{}).

CRITICAL EXAMPLES:
- WRONG: H2O  --> RIGHT: $H_2O$
- WRONG: C6H12O6 --> RIGHT: $C_6H_{12}O_{6}$
- WRONG: SO42- --> RIGHT: $SO_4^{2-}$

### OUTPUT FORMAT
{
  "stimuli": [
    {
      "stimulusNumber": 1,
      "content": "In photosynthesis, plants convert $CO_2$ and $H_2O$ into glucose...\n\n| Factor | Rate |\n|---|---|\n| Light | High |\n| Dark | Low |"
    }
  ],
  "questions": [
    {
      "stimulusNumber": 1,
      "questionNumber": 1,
      "questionType": "mcq",
      "confidence": 95,
      "questionText": "Based on the information above, which compound is reduced?",
      "choices": [
        { "key": "A", "text": "$CO_2$" },
        { "key": "B", "text": "$H_2O$" }
      ]
    },
    {
      "stimulusNumber": null,
      "questionNumber": 2,
      "questionType": "mcq",
      "confidence": 92,
      "questionText": "A student mixes 2 moles of $NaCl$ with...\n\n| Substance | Mass (g) |\n|---|---|\n| $NaCl$ | 117 |\n\nWhat is the total mass?",
      "choices": [
        { "key": "A", "text": "117 g" },
        { "key": "B", "text": "234 g" }
      ]
    }
  ]
}
`,
    },
  ])

  console.log(`Gemini query complete for ${exam.id}`)
  const text = result.response.text()

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      aiRawResponse: text,
    },
  })

  return text
}
