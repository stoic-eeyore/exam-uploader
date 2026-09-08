'use client'

import { useState } from 'react'

import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'

interface ReviewExamButtonProps {
  examId: string
  reviewedByAI?: boolean
}

export default function ReviewExamButton({ examId, reviewedByAI = false }: ReviewExamButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleReview = async () => {
    try {
      setIsLoading(true)
      setCompleted(false)

      const response = await fetch(`/api/exams/${examId}/review`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to review exam')
      }

      setCompleted(true)

      window.setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (error) {
      console.error('Failed to review exam:', error)
      alert('Failed to review exam')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleReview}
      disabled={isLoading}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : completed ? (
        <CheckCircle2 size={16} className="text-emerald-600" />
      ) : (
        <Sparkles size={16} />
      )}

      {isLoading
        ? 'Reviewing exam...'
        : completed
          ? 'Review completed!'
          : reviewedByAI
            ? 'Review Exam Again'
            : 'Review Exam with AI'}
    </button>
  )
}
