import type { Question } from '@/payload-types'
import type { QuestionDetail } from './types'
import { relationshipId } from '@/lib/payload/relationshipId'

export function mapQuestionDetail(question: Question): QuestionDetail {
  const exam = typeof question.exam === 'object' ? question.exam : undefined

  return {
    id: question.id,

    grade: relationshipId(question.grade) ?? null,
    subject: relationshipId(question.subject) ?? null,

    questionNumber: question.questionNumber || null,

    questionType: question.questionType || 'essay',

    questionText: question.questionText || null,

    options:
      question.options?.map((o) => ({
        text: o.text ?? null,
      })) ?? [],

    answer: question.answer || null,

    explanation: question.explanation || null,

    images:
      question.images?.map((img) => ({
        url: img.url,
        placement: img.placement || 'auto',
        width: img.width ?? null,
        alt: img.alt || null,
      })) ?? [],

    stimulus:
      question.stimulus && typeof question.stimulus === 'object'
        ? {
            id: question.stimulus.id,

            content: question.stimulus.content ?? null,

            images:
              question.stimulus.images?.map((img) => ({
                url: img.url,
                placement: img.placement ?? 'auto',
                width: img.width ?? null,
                alt: img.alt ?? null,
              })) ?? [],
          }
        : null,

    reviewedByAI: question.reviewedByAI ?? false,

    extractionConfidence: question.extractionConfidence ?? null,

    cognitiveLevel: question.cognitiveLevel ?? null,

    qualityIssues:
      question.qualityIssues?.map((q) => ({
        issue: q.issue || '',
        severity: q.severity || 'low',
      })) ?? [],

    suggestedQuestionText: question.suggestedQuestionText || null,

    suggestedQuestionType: question.suggestedQuestionType || null,

    suggestedOptions:
      question.suggestedOptions?.map((o) => ({
        text: o.text ?? null,
      })) ?? [],

    suggestedInstructions: question.suggestedInstructions || null,

    status: question.status || 'draft',

    fixes:
      question.fixes?.map((f) => ({
        note: f.note || '',
        fixedAt: f.fixedAt || null,
      })) ?? [],

    examTitle: exam?.title ?? '',

    examId: relationshipId(question.exam) ?? null,
  }
}
