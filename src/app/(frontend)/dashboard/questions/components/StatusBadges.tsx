import type { QuestionListItem } from '@/lib/questions/types'

interface Props {
  question: QuestionListItem
}

export function StatusBadges({ question }: Props) {
  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      <span className="rounded-full border px-2 py-1">
        {question.reviewedByAI ? 'AI Reviewed' : 'AI Pending'}
      </span>

      <span className="rounded-full border px-2 py-1 capitalize">{question.status}</span>

      {question.cognitiveLevel && (
        <span className="rounded-full border px-2 py-1 capitalize">{question.cognitiveLevel}</span>
      )}
    </div>
  )
}
