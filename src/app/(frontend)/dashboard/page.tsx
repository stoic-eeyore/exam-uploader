'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'

type ProcessingStatus = 'uploaded' | 'extracting' | 'review' | 'completed' | 'failed'

type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: string | null
  year?: string
  createdAt?: string
  processingStatus?: ProcessingStatus
  grade?: {
    name: string
  }
  subject?: {
    name: string
  }
}

type DashboardData = {
  totalExams: number
  recent: Exam[]
}

type AnalysisResponse = {
  success: boolean
  aiAnalysis?: string
  error?: string
}

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; color: string; bg: string; dot?: string }
> = {
  uploaded: {
    label: 'Uploaded',
    color: 'text-[#6b7280]',
    bg: 'bg-[#f3f4f6]',
  },
  extracting: {
    label: 'Extracting',
    color: 'text-[#b45309]',
    bg: 'bg-[#fef3c7]',
    dot: 'bg-[#f59e0b]',
  },
  review: {
    label: 'Review',
    color: 'text-[#1e40af]',
    bg: 'bg-[#dbeafe]',
    dot: 'bg-[#3b82f6]',
  },
  completed: {
    label: 'Completed',
    color: 'text-[#065f46]',
    bg: 'bg-[#d1fae5]',
    dot: 'bg-[#10b981]',
  },
  failed: {
    label: 'Failed',
    color: 'text-[#991b1b]',
    bg: 'bg-[#fee2e2]',
    dot: 'bg-[#ef4444]',
  },
}

function StatusBadge({ status }: { status?: ProcessingStatus }) {
  const config = status ? STATUS_CONFIG[status] : null
  if (!config) return <span className="text-[#6b7280] text-xs">-</span>

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-xs font-medium ${config.bg} ${config.color}`}
    >
      {config.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
            status === 'extracting' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {config.label}
    </span>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalExams, setTotalExams] = useState(0)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [showDevColumn, setShowDevColumn] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const inputSequence = useRef<string[]>([])
  const showDevColumnRef = useRef(showDevColumn)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)

  showDevColumnRef.current = showDevColumn

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          throw new Error(`Failed to load dashboard: ${res.status}`)
        }
        const data: DashboardData = await res.json()
        setTotalExams(data.totalExams)
        setRecent(data.recent)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      inputSequence.current.push(e.key.toLowerCase())
      if (inputSequence.current.length > 3) {
        inputSequence.current.shift()
      }

      const currentCode = inputSequence.current.join('')
      if (currentCode === 'zyx') {
        const newValue = !showDevColumnRef.current
        setShowDevColumn(newValue)
        console.log('🚧 Developer mode toggled:', newValue)
        inputSequence.current = []
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!selectedAnalysis) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAnalysis(null)
      }
    }

    closeButtonRef.current?.focus()
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      triggerButtonRef.current?.focus()
    }
  }, [selectedAnalysis])

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }

  const handleAnalyze = useCallback(async (exam: Exam) => {
    setAnalyzingId(exam.id)
    setAnalysisError(null)

    try {
      const res = await fetch('/api/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id }),
      })

      const data: AnalysisResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Analysis failed: ${res.status}`)
      }

      setRecent((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, aiAnalysis: data.aiAnalysis ?? null } : e)),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      setAnalysisError(message)
      console.error('Analysis error:', err)
    } finally {
      setAnalyzingId(null)
    }
  }, [])

  const openAnalysis = useCallback((analysis: string | null | undefined, examId: number) => {
    const trigger = document.querySelector(`[data-exam-id="${examId}"]`) as HTMLButtonElement
    if (trigger) triggerButtonRef.current = trigger

    setSelectedAnalysis(analysis ?? null)
  }, [])

  const renderAnalysis = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-gray-900">
            {line.slice(4)}
          </h3>
        )
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl font-bold mt-5 mb-2 text-gray-900">
            {line.slice(3)}
          </h2>
        )
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900">
            {line.slice(2)}
          </h1>
        )
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 mb-1 text-gray-700">
            {line.trim().slice(2)}
          </li>
        )
      }
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      if (line.trim() === '') {
        return <div key={i} className="h-2" />
      }
      return (
        <p key={i} className="mb-2 text-gray-700" dangerouslySetInnerHTML={{ __html: bolded }} />
      )
    })
  }

  // Determine if analysis should be disabled based on status
  const canAnalyze = (status?: ProcessingStatus) => {
    return status === 'uploaded' || status === 'completed' || status === 'failed'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-gray-500">Loading session...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[900px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-3xl font-bold text-[#111827]">Dashboard</h1>
              <span className="bg-[#e0e7ff] text-[#4338ca] px-2 py-0.5 rounded-[6px] text-xs font-semibold">
                {loading ? '...' : `${totalExams} Exams`}
              </span>
            </div>
            <p className="m-0 text-[#6b7280] text-[13px]">{session?.user?.email || '...'}</p>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard/upload">
              <button className="px-3.5 py-2 bg-[#2563eb] text-white border-none rounded-[6px] cursor-pointer font-semibold text-[13px] hover:bg-[#1d4ed8] transition-colors">
                + Upload
              </button>
            </Link>
            <button
              className="px-3 py-2 bg-transparent text-[#6b7280] border border-[#d1d5db] rounded-[6px] cursor-pointer text-[13px] hover:bg-gray-50 transition-colors"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong className="font-semibold">Error:</strong> {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analysis Error Toast */}
        {analysisError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
            <span>
              <strong>Analysis failed:</strong> {analysisError}
            </span>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-red-500 hover:text-red-700 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Card Wrapper */}
        <div className="bg-white rounded-lg p-[16px_20px] border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-4 text-base font-semibold text-[#374151]">Recently Uploaded</h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium mb-2">No exams uploaded yet</p>
              <p className="text-sm mb-4">Upload your first exam to get started.</p>
              <Link href="/dashboard/upload">
                <button className="px-4 py-2 bg-[#2563eb] text-white rounded-[6px] text-sm font-semibold hover:bg-[#1d4ed8] transition-colors">
                  Upload Exam
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Grade
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Subject
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Label
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Year
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Status
                    </th>
                    {showDevColumn && (
                      <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                        AI
                      </th>
                    )}
                    <th className="text-right py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((exam) => (
                    <tr key={exam.id} className="border-b border-[#f3f4f6] align-middle">
                      <td className="py-3 text-sm text-[#374151]">
                        <strong className="font-bold">{exam.grade?.name || '-'}</strong>
                      </td>
                      <td className="py-3 text-sm text-[#374151]">{exam.subject?.name || '-'}</td>
                      <td className="py-3 text-sm text-[#374151]">
                        {exam.label ? (
                          <span className="bg-[#f3f4f6] text-[#374151] px-2 py-0.5 rounded-[4px] text-xs">
                            {exam.label}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 text-sm text-[#374151]">{exam.year || '-'}</td>
                      <td className="py-3">
                        <StatusBadge status={exam.processingStatus} />
                      </td>
                      {showDevColumn && (
                        <td className="py-3 text-sm text-[#374151]">
                          {exam.aiAnalysis ? (
                            <button
                              ref={(el) => {
                                if (el) el.setAttribute('data-exam-id', String(exam.id))
                              }}
                              onClick={() => openAnalysis(exam.aiAnalysis, exam.id)}
                              className="px-3 py-1.5 bg-[#f5f7ff] text-[#4f46e5] border border-[#e0e7ff] rounded-[20px] cursor-pointer font-semibold text-xs inline-flex items-center gap-1 transition-all duration-200 no-underline hover:bg-[#eef0ff]"
                            >
                              View Analysis
                            </button>
                          ) : (
                            <button
                              disabled={
                                analyzingId === exam.id || !canAnalyze(exam.processingStatus)
                              }
                              data-exam-id={exam.id}
                              title={
                                !canAnalyze(exam.processingStatus)
                                  ? `Cannot analyze while status is "${exam.processingStatus}"`
                                  : undefined
                              }
                              className={`px-3 py-1.5 text-white border-none rounded-[20px] cursor-pointer font-semibold text-xs transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(99,102,241,0.2)] ${
                                analyzingId === exam.id
                                  ? 'opacity-70 cursor-not-allowed bg-[#9ca3af] shadow-none'
                                  : !canAnalyze(exam.processingStatus)
                                    ? 'opacity-50 cursor-not-allowed bg-[#9ca3af] shadow-none'
                                    : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7] hover:shadow-[0_4px_8px_rgba(99,102,241,0.3)]'
                              }`}
                              onClick={() => handleAnalyze(exam)}
                            >
                              {analyzingId === exam.id ? (
                                <>
                                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                '✨ Analyze'
                              )}
                            </button>
                          )}
                        </td>
                      )}
                      <td className="py-3 text-[13px] text-right font-semibold text-gray-700">
                        <div className="flex items-center justify-end gap-3">
                          {exam.driveUrl ? (
                            <a
                              href={exam.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors duration-150"
                            >
                              View
                            </a>
                          ) : (
                            '-'
                          )}
                          <Link
                            href={`/exams/${exam.id}`}
                            classpx="text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors duration-150"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Modal */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-5"
          onClick={() => setSelectedAnalysis(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="analysis-title"
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-[600px] max-h-[85vh] rounded-[16px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleModalKeyDown}
          >
            <div className="p-[16px_24px] border-b border-[#f3f4f6] flex justify-between items-center bg-white">
              <h2 id="analysis-title" className="m-0 text-lg font-bold text-gray-900">
                AI Analysis Results
              </h2>
              <button
                ref={closeButtonRef}
                onClick={() => setSelectedAnalysis(null)}
                className="bg-[#f3f4f6] border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-[#6b7280] text-xl transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                aria-label="Close analysis modal"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm leading-[1.6] text-[#374151] bg-[#fdfdfd]">
              {renderAnalysis(selectedAnalysis)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
