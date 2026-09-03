'use client'

import { useState } from 'react'
import { Pencil, X, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { StimulusFormData } from '@/types/stimulus'
import { StimulusForm } from '@/app/(frontend)/dashboard/questions/components/form/StimulusForm'
import { getStimulusApi } from '@/lib/stimuli/getStimulusApi'
import { updateStimulusApi } from '@/lib/stimuli/updateStimulusApi'
import { deleteStimulusApi } from '@/lib/stimuli/deleteStimulusApi'
import type { Stimulus } from '@/payload-types'
import { StimulusQuestionRange } from '@/components/questions/StimulusQuestionRange'

interface Props {
  stimulusId: number
  questionNumber: number
}

export default function EditStimulusModal({ stimulusId, questionNumber }: Props) {
  const [stimulus, setStimulus] = useState<Stimulus | null>(null)
  const [questionType, setQuestionType] = useState<'mcq' | 'essay' | null>(null)
  const [startQuestion, setStartQuestion] = useState(questionNumber)
  const [endQuestion, setEndQuestion] = useState(questionNumber)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const router = useRouter()

  async function handleOpen() {
    setStimulus(null)
    setQuestionType(null)
    setStartQuestion(questionNumber)
    setEndQuestion(questionNumber)

    setOpen(true)
    setLoading(true)

    try {
      const result = await getStimulusApi(stimulusId)

      setStimulus(result.stimulus)

      if (result.questions.length > 0) {
        setQuestionType(result.questions[0].questionType ?? null)

        const questionNumbers = result.questions
          .map((question) => question.questionNumber)
          .filter((number): number is number => number != null)

        if (questionNumbers.length > 0) {
          setStartQuestion(Math.min(...questionNumbers))
          setEndQuestion(Math.max(...questionNumbers))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: StimulusFormData) {
    if (!questionType) {
      return
    }

    try {
      await updateStimulusApi(stimulusId, questionType, startQuestion, endQuestion, data)

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Failed to save stimulus:', err)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to remove this stimulus? This action cannot be undone.',
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      await deleteStimulusApi(stimulusId)

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete stimulus:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all disabled:opacity-50"
      >
        <Pencil size={14} />
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Stimulus</h2>

              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : stimulus ? (
                <>
                  <StimulusQuestionRange
                    startQuestion={startQuestion}
                    endQuestion={endQuestion}
                    onStartChange={setStartQuestion}
                    onEndChange={setEndQuestion}
                  />

                  <StimulusForm
                    initialData={{
                      content: stimulus.content ?? '',
                      images: (stimulus.images ?? []).map((image) => ({
                        url: image.url,
                        placement: image.placement ?? 'right',
                        width: image.width ?? 220,
                        alt: image.alt ?? null,
                      })),
                    }}
                    onSave={handleSave}
                  />

                  <div className="border-t pt-5">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}

                      {deleting ? 'Removing...' : 'Remove stimulus'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">Failed to load stimulus.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
