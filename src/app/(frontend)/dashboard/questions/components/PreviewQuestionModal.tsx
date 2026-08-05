'use client'

import { useState } from 'react'
import { Eye, X, Loader2 } from 'lucide-react'
import { getQuestionApi } from '@/lib/questions/getQuestionApi'
import type { Question } from '@/payload-types'
import { QuestionStem } from '@/components/questions/QuestionStem'
import OptionList from '@/components/questions/OptionList'
import { Markdown } from '@/components/questions/Markdown'
import { StimulusContent } from '@/components/questions/StimulusContent'

interface Props {
  questionId: number
}

export default function PreviewQuestionModal({ questionId }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setOpen(true)
    setLoading(true)

    try {
      const question = await getQuestionApi(questionId)
      setQuestion(question)
      console.log('Fetched question:', question)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <Eye size={14} />
        Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Question Preview</h2>

              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              question && (
                <div className="space-y-8">
                  {question.stimulus && typeof question.stimulus === 'object' && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Stimulus
                      </div>

                      <StimulusContent
                        content={question.stimulus.content || ''}
                        images={question.stimulus.images || []}
                      />
                    </div>
                  )}

                  <QuestionStem question={question} />

                  {question.questionType === 'mcq' && question.options && (
                    <OptionList options={question.options} />
                  )}

                  {question.answer && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">Answer</h3>

                      <Markdown>{question.answer}</Markdown>
                    </div>
                  )}

                  {question.explanation && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">Explanation</h3>

                      <Markdown>{question.explanation}</Markdown>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  )
}
