import type { Question } from '@/payload-types'
import type { QuestionListItem } from './types'

function truncate(text: string | null | undefined, max = 140) {
  if (!text) return ''

  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

export function mapQuestionListItem(question: Question): QuestionListItem {
  const exam = typeof question.exam === 'object' ? question.exam : undefined

  const subject = exam && typeof exam.subject === 'object' ? exam.subject : undefined

  const grade = exam && typeof exam.grade === 'object' ? exam.grade : undefined

  return {
    id: question.id,

    questionNumber: question.questionNumber,

    questionText: truncate(question.questionText),

    questionType: question.questionType ?? 'essay',

    examTitle: exam?.title ?? 'Unknown Exam',

    subjectName: subject?.name ?? 'Unknown',

    gradeName: grade?.name ?? 'Unknown',

    reviewedByAI: question.reviewedByAI ?? false,

    status: question.status ?? 'draft',

    cognitiveLevel: question.cognitiveLevel ?? null,

    updatedAt: question.updatedAt,
  }
}
