'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { StimulusFormData } from '@/types/stimulus'
import { StimulusForm } from '@/app/(frontend)/dashboard/questions/components/form/StimulusForm'
import { createStimulus } from '@/lib/stimuli/createStimulus'
import { StimulusQuestionRange } from '@/components/questions/StimulusQuestionRange'

interface Props {
  questionId: number
  questionNumber: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateStimulusModal({
  questionId,
  questionNumber,
  open,
  onOpenChange,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [startQuestion, setStartQuestion] = useState(questionNumber)
  const [endQuestion, setEndQuestion] = useState(questionNumber)

  const router = useRouter()

  async function handleSave(data: StimulusFormData) {
    try {
      setError(null)

      await createStimulus(questionId, startQuestion, endQuestion, data)

      onOpenChange(false)

      router.refresh()
    } catch (err) {
      console.error('Failed to create stimulus:', err)

      setError(err instanceof Error ? err.message : 'Failed to create stimulus.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {' '}
        <div className="flex items-center justify-between mb-6">
          {' '}
          <h2 className="text-xl font-bold text-gray-900">Create Stimulus </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}
        <StimulusQuestionRange
          startQuestion={startQuestion}
          endQuestion={endQuestion}
          onStartChange={setStartQuestion}
          onEndChange={setEndQuestion}
        />
        <StimulusForm
          initialData={{
            content: '',
            images: [],
          }}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
