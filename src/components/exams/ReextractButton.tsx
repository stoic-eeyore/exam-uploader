'use client'

import { useState, useRef, useEffect } from 'react'
import { RotateCcw, X, Sparkles } from 'lucide-react'

interface ReextractButtonProps {
  questionId: number
}

export default function ReextractButton({ questionId }: ReextractButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false)
      }
    }
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expanded])

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch(`/api/questions/${questionId}/reextract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      })
      setExpanded(false)
      setInstructions('')
      window.location.reload()
    } catch (err) {
      console.error('Re-extraction failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
      >
        <RotateCcw size={14} />
        Re-extract
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Additional Instructions</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Diagram missing, focus on the second part..."
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Sparkles size={12} />
              {loading ? '...' : 'Re-extract'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
