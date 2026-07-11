'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface VerifyButtonProps {
  question: any
}

export default function VerifyButton({ question }: VerifyButtonProps) {
  const router = useRouter()
  const [verified, setVerified] = useState(question.status === 'verified')
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/questions/${question.id}/verify`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setVerified(data.status === 'verified')
        router.refresh() // Soft refresh — updates server components without full reload
      }
    } catch (err) {
      console.error('Failed to verify question:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all ${
        verified
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Check size={14} className={verified ? 'text-emerald-600' : 'text-gray-400'} />
      {verified ? 'Verified' : 'Verify'}
    </button>
  )
}
