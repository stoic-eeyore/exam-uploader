import type { QuestionListItem } from '@/lib/questions/types'
import { QuestionCard } from './QuestionCard'

interface Props {
  questions: QuestionListItem[]
}

export function QuestionList({ questions }: Props) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
        No questions found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  )
}
