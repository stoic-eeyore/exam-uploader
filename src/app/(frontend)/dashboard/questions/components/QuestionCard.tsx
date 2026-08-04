import Link from 'next/link'
import type { QuestionListItem } from '@/lib/questions/types'
import { StatusBadges } from './StatusBadges'

interface Props {
  question: QuestionListItem
}

export function QuestionCard({ question }: Props) {
  return (
    <Link
      href={`/dashboard/questions/${question.id}`}
      className="block rounded-lg border bg-card p-5 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-sm font-semibold text-muted-foreground">
            #{question.questionNumber}
          </div>

          <h2 className="line-clamp-2 text-base font-medium">{question.questionText}</h2>

          <div className="mt-3 text-sm text-muted-foreground">
            {question.subjectName}
            {' • '}
            {question.gradeName}
            {' • '}
            {question.questionType.toUpperCase()}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">{question.examTitle}</div>
        </div>

        <StatusBadges question={question} />
      </div>
    </Link>
  )
}
