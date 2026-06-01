'use client'

import { useState } from 'react'

export default function EditQuestionModal({ question }: { question: any }) {
  const [open, setOpen] = useState(false)

  const [questionText, setQuestionText] = useState(question.questionText)

  const [questionType, setQuestionType] = useState(question.questionType)

  async function handleSave() {
    await fetch(`/api/questions/${question.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionText,
        questionType,
        options: question.options || [],
      }),
    })

    window.location.reload()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded bg-blue-600 px-3 py-1 text-white">
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[900px] max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Edit Question</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Question Type</label>

                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="mcq">MCQ</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Question Text</label>

                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={10}
                  className="border rounded p-2 w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={handleSave} className="rounded bg-green-600 px-4 py-2 text-white">
                Save
              </button>

              <button onClick={() => setOpen(false)} className="rounded border px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
