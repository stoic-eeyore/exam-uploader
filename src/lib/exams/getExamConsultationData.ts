import config from '@payload-config'
import { getPayload } from 'payload'

export async function getExamConsultationData(examId: string) {
  console.log(`Fetching consultation data for exam ID: ${examId}`)
  const payload = await getPayload({
    config,
  })

  console.log('Fetching exam, questions, and stimuli data...')
  const [exam, questionsResult, stimuliResult] = await Promise.all([
    payload.findByID({
      collection: 'exams',
      id: examId,
      depth: 2,
    }),

    payload.find({
      collection: 'questions',
      where: {
        exam: {
          equals: examId,
        },
      },
      limit: 500,
      sort: ['questionType', 'questionNumber'],
      depth: 1,
    }),

    payload.find({
      collection: 'stimuli',
      where: {
        exam: {
          equals: examId,
        },
      },
      limit: 100,
      sort: 'stimulusNumber',
      depth: 1,
    }),
  ])

  const getRelationshipName = (value: any): string | null => {
    if (!value || typeof value === 'number' || typeof value === 'string') {
      return null
    }

    return value.name ?? value.title ?? null
  }

  const stimuliMap = new Map(
    stimuliResult.docs.map((stimulus) => [
      String(stimulus.id),
      {
        number: stimulus.stimulusNumber,
        content: stimulus.content,
      },
    ]),
  )

  return {
    exam: {
      title: exam.title ?? null,
      grade: getRelationshipName(exam.grade),
      subject: getRelationshipName(exam.subject),
      label: exam.label ?? null,
      year: exam.year ?? null,
      semester: exam.semester ?? null,
    },

    questions: questionsResult.docs.map((question) => {
      const stimulusId =
        typeof question.stimulus === 'object' && question.stimulus !== null
          ? String(question.stimulus.id)
          : question.stimulus
            ? String(question.stimulus)
            : null

      const stimulus = stimulusId ? stimuliMap.get(stimulusId) : null

      return {
        number: question.questionNumber ?? null,
        type: question.questionType ?? null,
        question: question.questionText ?? '',

        ...(question.questionType === 'mcq' && question.options
          ? {
              options: question.options.map((option) => option.text ?? ''),
            }
          : {}),

        ...(question.answer
          ? {
              answer: question.answer,
            }
          : {}),

        ...(stimulus
          ? {
              stimulus,
            }
          : {}),

        ...(question.cognitiveLevel
          ? {
              cognitiveLevel: question.cognitiveLevel,
            }
          : {}),

        ...(question.qualityIssues?.length
          ? {
              qualityIssues: question.qualityIssues.map((issue) => ({
                issue: issue.issue ?? '',
                severity: issue.severity ?? null,
              })),
            }
          : {}),
      }
    }),
  }
}
