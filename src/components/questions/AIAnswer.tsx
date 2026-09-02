'use client'

import { useState } from 'react'
import { RefreshCw, Pencil, Save, X } from 'lucide-react'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState(answer ?? '')
  const [editedExplanation, setEditedExplanation] = useState(explanation ?? '')
  const [isSaving, setIsSaving] = useState(false)

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

  const handleEdit = () => {
    setEditedAnswer(answer ?? '')
    setEditedExplanation(explanation ?? '')
    setError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedAnswer(answer ?? '')
    setEditedExplanation(explanation ?? '')
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/questions/${question.id}/answer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: editedAnswer || null,
          explanation: editedExplanation || null,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()

      setAnswer(data.answer ?? null)
      setExplanation(data.explanation ?? null)

      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save answer'

      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

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

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={12} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={12} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <Pencil size={12} />
                </button>

                <button
                  type="button"
                  onClick={handleReanswer}
                  disabled={isReanswering}
                  className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isReanswering ? 'animate-spin' : ''} />
                  {isReanswering ? 'Re-answering...' : 'Re-answer'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Answer
          </div>

          {isEditing ? (
            <textarea
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          ) : answer ? (
            <div className="font-semibold text-gray-900">
              <Markdown>{answer}</Markdown>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No answer</div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Explanation
          </div>

          {isEditing ? (
            <textarea
              value={editedExplanation}
              onChange={(e) => setEditedExplanation(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          ) : explanation ? (
            <div className="prose max-w-none text-sm text-gray-700">
              <Markdown>{explanation}</Markdown>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No explanation</div>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  )
}
