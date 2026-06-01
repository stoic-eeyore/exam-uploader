'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExtractButton({ examId }: { examId: string }) {
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleExtract() {
    try {
      setLoading(true)

      const response = await fetch(`/api/exams/${examId}/extract`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExtract}
      disabled={loading}
      className="rounded bg-blue-600 px-4 py-2 text-white"
    >
      {loading ? 'Extracting...' : 'Extract Questions'}
    </button>
  )
}
