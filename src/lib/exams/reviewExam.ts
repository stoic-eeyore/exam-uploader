import config from '@payload-config'
import { getPayload } from 'payload'
import { geminiModel } from '@/lib/gemini'
import { extractJson } from '@/utils/json'
import { getExamConsultationData } from './getExamConsultationData'
import { prepareExamReviewForStorage } from './prepareExamReviewForStorage'

export async function reviewExam(examId: string) {
  const payload = await getPayload({
    config,
  })

  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam) {
    throw new Error('Exam not found')
  }

  console.log(`Preparing AI review data for exam ${exam.id}`)

  const examData = await getExamConsultationData(examId)

  if (!examData.questions.length) {
    throw new Error('Exam has no questions')
  }

  console.log(`Starting AI review for exam ${exam.id} with ${examData.questions.length} questions`)

  const result = await geminiModel.generateContent([
    {
      text: `
You are an expert educational assessment reviewer.

You will receive a structured JSON representation of an exam.

The exam contains:
- exam metadata
- stimuli shared by one or more questions
- questions

When a question contains "stimulusNumber", refer to the corresponding
stimulus in the "stimuli" array.

Your task has TWO separate parts.

========================================
PART 1 — REVIEW EACH QUESTION
========================================

For EVERY question, perform the following tasks.

1. CLASSIFY THE COGNITIVE LEVEL

Classify the primary cognitive process required to answer correctly as exactly one of:

- lots
- mots
- hots

Definitions:

LOTS (Lower-Order Thinking Skills)

Questions primarily requiring:
- recall
- memorization
- recognition
- direct identification
- retrieval of facts
- straightforward execution of a familiar procedure

MOTS (Middle-Order Thinking Skills)

Questions primarily requiring:
- understanding
- interpretation
- explanation
- comparison
- classification
- connecting concepts
- application in a familiar context

HOTS (Higher-Order Thinking Skills)

Questions primarily requiring:
- analysis
- evaluation
- reasoning
- synthesis
- judgment
- problem solving
- constructing arguments
- application in unfamiliar or non-routine contexts

IMPORTANT:

Classify based on the cognitive PROCESS required to answer correctly,
NOT based on how difficult the question appears.

A difficult trivia question is still LOTS if it only requires recall.

A long calculation is not automatically HOTS if it only requires applying
a routine algorithm.

Do not classify based on the wording alone. Consider what the student must
actually think or do to arrive at the answer.

----------------------------------------
2. IDENTIFY SERIOUS CORRECTNESS ISSUES
----------------------------------------

Identify ONLY serious correctness issues.

A serious correctness issue is a problem that could materially prevent the
question from validly assessing the intended student capability.

Examples include:

- The provided answer is incorrect.
- No correct answer exists.
- Multiple answers are reasonably defensible when only one answer is expected.
- Essential information required to answer is missing.
- The question contains a factual error.
- The question contains a mathematical error.
- The question contains a scientific error.
- The question contains a logical error.
- The wording is materially ambiguous and reasonable interpretations lead to different answers.
- The answer options do not correspond to the question.
- The question contradicts itself.
- A required stimulus, diagram, table, or context is missing or insufficient.

Do NOT report:

- Minor grammar mistakes.
- Stylistic preferences.
- Slightly awkward wording that does not materially affect meaning.
- A question merely being easy.
- A question merely being difficult.
- Suggestions for making a question more interesting.
- Suggestions for increasing HOTS.
- General pedagogical improvements.

If there are no serious correctness issues, return an empty array.

========================================
PART 2 — REVIEW THE EXAM AS A WHOLE
========================================

Assume that ALL serious correctness issues identified in Part 1 have been fixed.

Do NOT allow individual correctness problems to dominate the overall exam review.

Evaluate the exam as a whole based on its ability to assess student capability
in a modern education system.

The purpose is NOT simply to determine whether the exam is difficult.

Evaluate what meaningful evidence the assessment can provide about what
students know, understand, and can do.

Evaluate the following dimensions:

1. cognitiveRange

Does the exam assess an appropriate range of LOTS, MOTS, and HOTS?

Consider whether the cognitive distribution is appropriate for the subject,
grade level, and likely purpose of the exam.

Do NOT assume every good exam must contain equal amounts of LOTS, MOTS,
and HOTS.

2. depthOfUnderstanding

Does the exam assess conceptual understanding, or does it primarily assess
memorization and superficial recall?

3. applicationAndTransfer

Does the exam require students to apply knowledge or skills?

Where appropriate, does it require application beyond direct repetition of
a familiar classroom example?

4. reasoningAndProblemSolving

Does the exam provide meaningful opportunities for students to demonstrate:

- reasoning
- analysis
- problem solving
- justification
- evaluation
- argumentation

5. authenticity

Where appropriate for the subject, do questions use meaningful,
realistic, intellectually authentic, or contextually meaningful situations?

Do NOT force real-world contexts where they would be artificial or
pedagogically inappropriate.

6. overallAssessmentQuality

Considering the exam as a whole, how well does it provide meaningful
evidence of student capability?

Does it primarily measure memorization and routine performance, or does it
also provide evidence of deeper understanding and transferable thinking?

----------------------------------------
RATINGS
----------------------------------------

For each assessment dimension, assign exactly one rating:

- weak
- adequate
- strong

Use "weak" when the exam provides little meaningful evidence for that dimension.

Use "adequate" when the dimension is reasonably represented but has important limitations.

Use "strong" when the exam provides substantial and meaningful evidence for that dimension.

Do not artificially inflate ratings.

----------------------------------------
RECOMMENDATIONS
----------------------------------------

Provide practical recommendations focused on improving the EXAM AS A WHOLE.

Recommendations should address the most important assessment design weaknesses.

Do not give minor wording suggestions.

Return ONLY valid JSON.

Do not use Markdown.

Do not include comments.

The response MUST follow exactly this structure:

{
  "questionReviews": [
    {
      "questionNumber": 1,
      "questionType": "mcq",
      "cognitiveLevel": "lots",
      "correctnessIssues": [
        {
          "issue": "Short description of the serious correctness issue",
          "severity": "high",
          "explanation": "Brief explanation of why this materially affects correctness."
        }
      ]
    }
  ],
  "examReview": {
    "summary": "Brief overall assessment summary.",
    "strengths": [
      "..."
    ],
    "limitations": [
      "..."
    ],
    "assessmentDimensions": {
      "cognitiveRange": {
        "rating": "weak",
        "explanation": "..."
      },
      "depthOfUnderstanding": {
        "rating": "adequate",
        "explanation": "..."
      },
      "applicationAndTransfer": {
        "rating": "weak",
        "explanation": "..."
      },
      "reasoningAndProblemSolving": {
        "rating": "weak",
        "explanation": "..."
      },
      "authenticity": {
        "rating": "adequate",
        "explanation": "..."
      },
      "overallAssessmentQuality": {
        "rating": "adequate",
        "explanation": "..."
      }
    },
    "recommendations": [
      "..."
    ]
  }
}

Here is the exam data:

${JSON.stringify(examData)}
`,
    },
  ])

  const text = result.response.text()

  console.log(`Received AI review for exam ${exam.id}`)

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      aiRawResponse: text,
    },
  })

  const cleaned = extractJson(text)

  const parsed = JSON.parse(cleaned)

  console.log(`Parsed AI review for exam ${exam.id}`)

  const questionsResult = await payload.find({
    collection: 'questions',
    where: {
      exam: {
        equals: examId,
      },
    },
    limit: 500,
  })

  const questionMap = new Map(
    questionsResult.docs.map((question) => [
      `${question.questionNumber}_${question.questionType}`,
      question,
    ]),
  )

  for (const review of parsed.questionReviews || []) {
    const question = questionMap.get(`${review.questionNumber}_${review.questionType}`)

    if (!question) {
      console.warn(`Could not find question ${review.questionNumber}_${review.questionType}`)
      continue
    }

    console.log(`Updating question ${question.id}: ${review.cognitiveLevel}`)

    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        reviewedByAI: true,
        cognitiveLevel: review.cognitiveLevel,
        qualityIssues: review.correctnessIssues || [],
      },
    })
  }

  await payload.update({
    collection: 'exams',
    id: exam.id,
    data: {
      reviewedByAI: true,
      examReview: parsed.examReview,
    },
  })

  console.log(`Completed AI review for exam ${exam.id}`)

  return parsed
}
