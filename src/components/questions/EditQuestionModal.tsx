'use client'

import { useState } from 'react'
import { Pencil, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EditableQuestion, QuestionDetail, QuestionFormData } from '@/lib/questions/types'
import { updateQuestionApi } from '@/lib/questions/updateQuestionApi'
import { relationshipId } from '@/lib/payload/relationshipId'
import { QuestionForm } from '@/app/(frontend)/dashboard/questions/components/form/QuestionForm'
import { Grade, Question, Subject } from '@/payload-types'
import { getQuestionApi } from '@/lib/questions/getQuestionApi'

interface Props {
  questionId: number

  grades: Grade[]
  subjects: Subject[]
}

export default function EditQuestionModal({ questionId, grades, subjects }: Props) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleOpen() {
    setQuestion(null)
    setOpen(true)
    setLoading(true)

    try {
      const question = await getQuestionApi(questionId)
      setQuestion(question)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: QuestionFormData) {
    setSaving(true)
    try {
      await updateQuestionApi(questionId, data)

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
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
              <h2 className="text-xl font-bold text-gray-900">Edit Question</h2>
              <button
                onClick={() => setOpen(false)}
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
              ) : question ? (
                <QuestionForm
                  initialData={{
                    grade: relationshipId(question.grade) ?? null,
                    subject: relationshipId(question.subject) ?? null,

                    questionType: question.questionType ?? 'essay',

                    questionText: question.questionText ?? '',

                    options: (question.options ?? []).map((option) => ({
                      text: option.text ?? null,
                    })),

                    images: (question.images ?? []).map((image) => ({
                      url: image.url,
                      placement: image.placement ?? 'right',
                      width: image.width ?? 220,
                      alt: image.alt ?? null,
                    })),
                  }}
                  grades={grades}
                  subjects={subjects}
                  onSave={handleSave}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">Failed to load question.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
