'use client'

import { useState } from 'react'
import { Pencil, X, Loader2, Trash2, Plus } from 'lucide-react'

export default function EditQuestionModal({ question }: { question: any }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState(question.options || [])
  const [questionText, setQuestionText] = useState(question.questionText)
  const [questionType, setQuestionType] = useState(question.questionType)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/questions/${question.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText,
          questionType,
          options,
        }),
      })
      window.location.reload()
    } catch (err) {
      console.error('Failed to save:', err)
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
                  onChange={(e) => setQuestionType(e.target.value)}
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

              {questionType === 'mcq' && (
                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-700">Options</label>

                  <div className="space-y-3">
                    {options.map((option: any, index: number) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="w-8 pt-2.5 text-sm font-bold text-gray-400">
                          {String.fromCharCode(65 + index)}
                        </div>

                        <textarea
                          value={option.text}
                          onChange={(e) => {
                            const updated = [...options]
                            updated[index] = { ...updated[index], text: e.target.value }
                            setOptions(updated)
                          }}
                          rows={3}
                          className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = options.filter((_: any, i: number) => i !== index)
                            setOptions(updated)
                          }}
                          className="mt-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                          title="Remove option"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOptions([...options, { text: '' }])}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Plus size={14} />
                    Add Option
                  </button>
                </div>
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
