'use client'

import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'

interface CopyExamForAIProps {
  examId: string
}

export default function CopyExamForAI({ examId }: CopyExamForAIProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      setIsLoading(true)
      setCopied(false)

      const response = await fetch(`/api/exams/${examId}/consultation-data`)

      if (!response.ok) {
        throw new Error('Failed to generate consultation data')
      }

      const data = await response.json()

      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy exam for AI:', error)
      alert('Failed to copy exam data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={isLoading}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : copied ? (
        <Check size={16} className="text-emerald-600" />
      ) : (
        <Copy size={16} />
      )}

      {isLoading ? 'Preparing...' : copied ? 'Copied!' : 'Copy Exam for AI'}
    </button>
  )
}
