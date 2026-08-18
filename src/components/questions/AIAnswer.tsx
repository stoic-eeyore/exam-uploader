import { Markdown } from './Markdown'

interface Props {
  answer?: string | null
  explanation?: string | null
}

export function AIAnswer({ answer, explanation }: Props) {
  if (!answer && !explanation) return null

  const unableToDetermine = answer === 'Unable to determine'

  return (
    <div className="ml-[3.25rem] mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-indigo-100 bg-indigo-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-900">AI Answer</span>

          {unableToDetermine && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Needs Review
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {answer && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Answer
            </div>

            <div className="font-semibold text-gray-900">{answer}</div>
          </div>
        )}

        {explanation && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Explanation
            </div>

            <div className="prose max-w-none text-sm text-gray-700">
              <Markdown>{explanation}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
