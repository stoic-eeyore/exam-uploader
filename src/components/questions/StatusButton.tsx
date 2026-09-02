'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Flag, FileText } from 'lucide-react'

interface StatusButtonProps {
  question: any
}

type QuestionStatus = 'draft' | 'flagged' | 'verified'

export default function StatusButton({ question }: StatusButtonProps) {
  const router = useRouter()

  const [status, setStatus] = useState<QuestionStatus>(question.status)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const updateStatus = async (newStatus: QuestionStatus) => {
    setLoading(true)
    setOpen(false)

    try {
      const res = await fetch(`/api/questions/${question.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        console.error('Failed to update question status')
        return
      }

      const data = await res.json()

      setStatus(data.status)
      router.refresh()
    } catch (err) {
      console.error('Failed to update question status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMainAction = () => {
    // Happy path:
    // Draft / Flagged → Verified
    // Verified → Draft
    if (status === 'verified') {
      updateStatus('draft')
    } else {
      updateStatus('verified')
    }
  }

  const isVerified = status === 'verified'
  const isFlagged = status === 'flagged'

  const buttonStyle = isVerified
    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    : isFlagged
      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleMainAction}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all ${buttonStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVerified ? (
          <Check size={14} className="text-emerald-600" />
        ) : isFlagged ? (
          <Flag size={14} className="text-amber-600" />
        ) : (
          <Check size={14} className="text-gray-400" />
        )}

        {isVerified ? 'Verified' : 'Verify'}
      </button>

      <div className="w-px bg-gray-200" />

      <button
        onClick={() => setOpen((value) => !value)}
        disabled={loading}
        className={`px-2 transition-all ${buttonStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Change question status"
      >
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => updateStatus('verified')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Check size={14} className="text-emerald-600" />
            Verified
          </button>

          <button
            onClick={() => updateStatus('draft')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText size={14} className="text-gray-500" />
            Draft
          </button>

          <button
            onClick={() => updateStatus('flagged')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Flag size={14} className="text-amber-600" />
            Flagged
          </button>
        </div>
      )}
    </div>
  )
}
