import type { QuestionListItem } from '@/lib/questions/types'

interface Props {
  question: QuestionListItem
}

export function StatusBadges({ question }: Props) {
  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      {question.cognitiveLevel && (
        <span className="rounded bg-blue-100 px-2 py-1 text-xs">{question.cognitiveLevel}</span>
      )}
    </div>
  )
}
