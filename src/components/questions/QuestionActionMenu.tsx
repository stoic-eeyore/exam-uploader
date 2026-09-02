'use client'

import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import CreateStimulusModal from './CreateStimulusModal'
import CopyQuestionButton from './CopyQuestionButton'

interface Props {
  question: {
    id: number
    questionNumber?: number | null
    questionText?: string | null
    questionType?: 'mcq' | 'essay' | null
    options?:
      | {
          text?: string | null
        }[]
      | null
    images?:
      | {
          url: string
          alt?: string | null
        }[]
      | null
    stimulus?:
      | {
          stimulusNumber?: number | null
          content?: string | null
          images?:
            | {
                url: string
                alt?: string | null
              }[]
            | null
        }
      | number
      | null
  }
}

export default function QuestionActionsMenu({ question }: Props) {
  const [open, setOpen] = useState(false)
  const [createStimulusOpen, setCreateStimulusOpen] = useState(false)

  const questionId = question.id
  const questionNumber = question.questionNumber
  const hasStimulus = Boolean(question.stimulus)

  return (
    <>
      {' '}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          title="More actions"
        >
          {' '}
          <MoreHorizontal size={18} />{' '}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-40 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <CopyQuestionButton question={question} onCopied={() => setOpen(false)} />

            {!hasStimulus && (
              <button
                onClick={() => {
                  setOpen(false)
                  setCreateStimulusOpen(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus size={15} />
                Create Stimulus
              </button>
            )}
          </div>
        )}
      </div>
      {!hasStimulus && (
        <CreateStimulusModal
          questionId={questionId}
          questionNumber={questionNumber ?? 0}
          open={createStimulusOpen}
          onOpenChange={setCreateStimulusOpen}
        />
      )}
    </>
  )
}
