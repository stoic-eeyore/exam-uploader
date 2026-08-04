import type { QuestionDetail } from '@/lib/questions/types'

interface Props {
  question: QuestionDetail
}

export function QuestionContentCard({ question }: Props) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Question</h2>

      <p className="whitespace-pre-wrap">{question.questionText}</p>

      {question.images.length > 0 && (
        <div className="mt-6 space-y-4">
          {question.images.map((image, index) => (
            <img
              key={index}
              src={image.url}
              alt={image.alt ?? ''}
              className="max-w-full rounded border"
            />
          ))}
        </div>
      )}

      {question.questionType === 'mcq' && question.options.length > 0 && (
        <div className="mt-8 space-y-3">
          {question.options.map((option, index) => (
            <div key={index} className="rounded border p-3">
              <strong>{String.fromCharCode(65 + index)}.</strong> {option.text}
            </div>
          ))}
        </div>
      )}

      {question.answer && (
        <div className="mt-8">
          <h3 className="font-medium">Answer</h3>

          <p className="mt-2 whitespace-pre-wrap">{question.answer}</p>
        </div>
      )}

      {question.explanation && (
        <div className="mt-8">
          <h3 className="font-medium">Explanation</h3>

          <p className="mt-2 whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
