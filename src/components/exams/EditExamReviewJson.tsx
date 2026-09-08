'use client'

import { useEffect, useState } from 'react'
import { Check, Code2, Loader2, X } from 'lucide-react'

interface EditExamReviewJsonProps {
  examId: string
  review: unknown
  onClose: () => void
}

export default function EditExamReviewJson({ examId, review, onClose }: EditExamReviewJsonProps) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setJsonText(JSON.stringify(review ?? {}, null, 2))
  }, [review])

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText)

      setJsonText(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch {
      setError('Invalid JSON. Please fix the JSON before formatting.')
    }
  }

  const handleSave = async () => {
    setError(null)

    let parsed: unknown

    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setError('Invalid JSON. Please fix the JSON before saving.')
      return
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setError('The review must be a JSON object.')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/exams/${examId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examReview: parsed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save review')
      }

      setSaved(true)

      window.setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Failed to save exam review:', error)
      setError('Failed to save the review.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-gray-600" />

            <h2 className="font-semibold text-gray-900">Edit Assessment Review JSON</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value)
              setError(null)
              setSaved(false)
            }}
            spellCheck={false}
            className="min-h-[500px] w-full flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={handleFormat}
            disabled={isSaving}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Format JSON
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || saved}
              className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check size={16} />
                  Saved
                </>
              ) : (
                'Save Review'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
