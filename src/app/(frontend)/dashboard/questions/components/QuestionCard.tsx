import Link from 'next/link'
import type { QuestionListItem, EditableQuestion } from '@/lib/questions/types'
import { StatusBadges } from './StatusBadges'
import EditQuestionModal from '@/components/questions/EditQuestionModal'
import { Grade, Subject } from '@/payload-types'
import PreviewQuestionModal from './PreviewQuestionModal'

interface Props {
  question: QuestionListItem & EditableQuestion

  grades: Grade[]
  subjects: Subject[]
}

export function QuestionCard({ question, grades, subjects }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-medium text-gray-900">
            {question.questionText}
          </h2>

          <div className="mt-3 text-sm text-gray-500">
            {question.gradeName} • {question.subjectName} • {question.questionType.toUpperCase()}
          </div>

          <div className="mt-2">
            {question.examDriveUrl ? (
              <a
                href={question.examDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Original Exam ↗
              </a>
            ) : (
              <span className="text-sm text-gray-400">Manual Question</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <StatusBadges question={question} />

          <div className="flex gap-2">
            <PreviewQuestionModal questionId={question.id} />
            <EditQuestionModal questionId={question.id} grades={grades} subjects={subjects} />
          </div>
        </div>
      </div>
    </div>
  )
}
