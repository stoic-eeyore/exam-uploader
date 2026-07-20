'use client'

import { useEffect, useRef } from 'react'

type AnalysisModalProps = {
  analysis: string
  onClose: () => void
}

function renderAnalysis(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-gray-900">{line.slice(4)}</h3>
    }
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold mt-5 mb-2 text-gray-900">{line.slice(3)}</h2>
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900">{line.slice(2)}</h1>
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <li key={i} className="ml-4 mb-1 text-gray-700">{line.trim().slice(2)}</li>
    }
    const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    if (line.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="mb-2 text-gray-700" dangerouslySetInnerHTML={{ __html: bolded }} />
  })
}

export function AnalysisModal({ analysis, onClose }: AnalysisModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[600px] max-h-[85vh] rounded-[16px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-[16px_24px] border-b border-[#f3f4f6] flex justify-between items-center bg-white">
          <h2 id="analysis-title" className="m-0 text-lg font-bold text-gray-900">
            AI Analysis Results
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="bg-[#f3f4f6] border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-[#6b7280] text-xl transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
            aria-label="Close analysis modal"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm leading-[1.6] text-[#374151] bg-[#fdfdfd]">
          {renderAnalysis(analysis)}
        </div>
      </div>
    </div>
  )
}

