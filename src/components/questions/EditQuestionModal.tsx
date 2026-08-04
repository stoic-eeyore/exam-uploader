'use client'

import { useState } from 'react'
import { Pencil, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import QuestionOptionsEditor from './QuestionOptionsEditor'
import QuestionImageEditor from './QuestionImageEditor'
import type { QuestionDetail } from '@/lib/questions/types'
import { updateQuestionApi } from '@/lib/questions/updateQuestionApi'

interface Props {
  question: QuestionDetail
}

export default function EditQuestionModal({ question }: Props) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState(question.options || [])
  const [questionText, setQuestionText] = useState(question.questionText ?? '')
  const [questionType, setQuestionType] = useState(question.questionType)
  const [imageUrl, setImageUrl] = useState(question.images?.[0]?.url ?? '')
  const [imagePlacement, setImagePlacement] = useState(question.images?.[0]?.placement ?? 'right')
  const [imageWidth, setImageWidth] = useState(question.images?.[0]?.width ?? 220)
  const [hasImage, setHasImage] = useState(question.images?.length > 0)
  const [saving, setSaving] = useState(false)

  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    try {
      const images =
        hasImage && imageUrl
          ? [
              {
                url: imageUrl,
                placement: imagePlacement,
                width: imageWidth,
              },
            ]
          : []

      await updateQuestionApi(question.id, {
        questionText,
        questionType,
        options,
        images,
      })

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
        onClick={() => setOpen(true)}
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
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'mcq' | 'essay')}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  Question Text
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={8}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                />
              </div>

              <QuestionImageEditor
                hasImage={hasImage}
                setHasImage={setHasImage}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                imagePlacement={imagePlacement}
                setImagePlacement={setImagePlacement}
                imageWidth={imageWidth}
                setImageWidth={setImageWidth}
              />

              {questionType === 'mcq' && (
                <QuestionOptionsEditor options={options} onChange={setOptions} />
              )}
            </div>

            <div className="mt-8 flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
