'use client'

import { useState } from 'react'

export default function ReviewSuggestionModal({
  question,
}: {
  question: any
}) {
  const [open, setOpen] =
    useState(false)

  async function handleAccept() {
    await fetch(
      `/api/questions/${question.id}/accept-suggestion`,
      {
        method: 'POST',
      },
    )

    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-yellow-600 px-3 py-1 text-white"
      >
        Review Suggestion
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[900px] max-h-[80vh] overflow-auto rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Review Suggestion
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold">
                  Current
                </h3>

                <div className="border p-4 rounded">
                  {question.questionText}
                </div>
              </div>

              <div>
                <h3 className="font-bold">
                  Suggested
                </h3>

                <div className="border p-4 rounded">
                  {
                    question.suggestedQuestionText
                  }
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAccept}
                className="rounded bg-green-600 px-4 py-2 text-white"
              >
                Accept
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded border px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

