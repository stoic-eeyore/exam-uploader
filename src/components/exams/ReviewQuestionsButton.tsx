'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewQuestionsButton({ examId }: { examId: number }) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleReview() {
    if (isReviewing) return

    setError(null)
    setIsReviewing(true)

    try {
      const response = await fetch(`/api/exams/${examId}/review`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Review failed')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError('AI review failed. Please try again.')
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <>
      <button
        onClick={handleReview}
        disabled={isReviewing}
        className={`rounded bg-purple-600 px-4 py-2 text-white transition-opacity ${
          isReviewing ? 'cursor-not-allowed opacity-50' : 'hover:bg-purple-700'
        }`}
      >
        {isReviewing ? 'Running AI Review...' : 'Run AI Review'}
      </button>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </>
  )
}
