'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Markdown } from './Markdown'

interface Props {
  question: {
    id: string | number
    answer?: string | null
    explanation?: string | null
  }
}

export function AIAnswer({ question }: Props) {
  const [answer, setAnswer] = useState(question.answer ?? null)
  const [explanation, setExplanation] = useState(question.explanation ?? null)
  const [isReanswering, setIsReanswering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Don't expose the experimental AI answering feature
  // until the question already has an AI-generated answer.
  if (!answer && !explanation) return null

  const handleReanswer = async () => {
    setIsReanswering(true)
    setError(null)

    try {
      const res = await fetch(`/api/questions/${question.id}/answer`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()

      setAnswer(data.answer ?? null)
      setExplanation(data.explanation ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to re-answer question'
      setError(message)
    } finally {
      setIsReanswering(false)
    }
  }

  const unableToDetermine = answer === 'Unable to determine'

  return (
    <div className="ml-[3.25rem] mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-indigo-100 bg-indigo-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-900">AI Answer</span>

            {unableToDetermine && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Needs Review
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleReanswer}
            disabled={isReanswering}
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={12} className={isReanswering ? 'animate-spin' : ''} />
            {isReanswering ? 'Re-answering...' : 'Re-answer'}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {answer && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Answer
            </div>

            <div className="font-semibold text-gray-900">
              <Markdown>{answer}</Markdown>
            </div>
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

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  )
}
