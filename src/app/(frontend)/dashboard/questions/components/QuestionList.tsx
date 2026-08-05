import type { QuestionListItem } from '@/lib/questions/types'
import { QuestionCard } from './QuestionCard'
import { Grade, Subject } from '@/payload-types'

interface Props {
  questions: QuestionListItem[]

  grades: Grade[]
  subjects: Subject[]
}

export function QuestionList({ questions, grades, subjects }: Props) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        No questions found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} grades={grades} subjects={subjects} />
      ))}
    </div>
  )
}
