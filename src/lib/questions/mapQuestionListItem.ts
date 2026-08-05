import type { Question } from '@/payload-types'
import type { QuestionListItem } from './types'

function truncate(text: string | null | undefined, max = 140) {
  if (!text) return ''

  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

export function mapQuestionListItem(question: Question): QuestionListItem {
  const exam = typeof question.exam === 'object' ? question.exam : undefined

  const subjectName = typeof question.subject === 'object' ? question.subject?.name : undefined
  const gradeName = typeof question.grade === 'object' ? question.grade?.name : undefined

  return {
    id: question.id,

    questionNumber: question.questionNumber ?? 0,

    questionText: truncate(question.questionText),

    questionType: question.questionType ?? 'essay',

    examTitle: exam?.title ?? '',
    examDriveUrl: exam?.driveUrl ?? '',

    subjectName: subjectName ?? 'Unknown',

    gradeName: gradeName ?? 'Unknown',

    reviewedByAI: question.reviewedByAI ?? false,

    status: question.status ?? 'draft',

    cognitiveLevel: question.cognitiveLevel ?? null,

    updatedAt: question.updatedAt,
  }
}
