'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { formatQuestionForClipboard } from '@/lib/questions/formatQuestionForClipboard'

interface Props {
  question: Parameters<typeof formatQuestionForClipboard>[0]
  onCopied?: () => void
}

export default function CopyQuestionButton({ question, onCopied }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = formatQuestionForClipboard(question)

    await navigator.clipboard.writeText(text)

    setCopied(true)

    onCopied?.()

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}

      {copied ? 'Copied' : 'Copy for AI'}
    </button>
  )
}
