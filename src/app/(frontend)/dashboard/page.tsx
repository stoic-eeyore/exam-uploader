'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { DashboardData, Exam, AnalysisResponse } from './types'
import { FilterBar, FilterState } from './components/FilterBar'
import { ExamTable } from './components/ExamTable'
import { AnalysisModal } from './components/AnalysisModal'

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession()

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalExams, setTotalExams] = useState(0)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    grade: '',
    subject: '',
    label: '',
    year: '',
    status: 'all',
    search: '',
  })

  // Dev mode
  const [showDevColumn, setShowDevColumn] = useState(false)
  const inputSequence = useRef<string[]>([])
  const showDevColumnRef = useRef(showDevColumn)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)

  showDevColumnRef.current = showDevColumn

  // ── Load dashboard data ───────────────────────────────────────────
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error(`Failed to load dashboard: ${res.status}`)
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

  // ── Dev mode toggle (type "zyx") ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      inputSequence.current.push(e.key.toLowerCase())
      if (inputSequence.current.length > 3) inputSequence.current.shift()

      if (inputSequence.current.join('') === 'zyx') {
        const newValue = !showDevColumnRef.current
        setShowDevColumn(newValue)
        console.log('🚧 Developer mode toggled:', newValue)
        inputSequence.current = []
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Extract unique filter options from data ───────────────────────
  const filterOptions = useMemo(() => {
    const grades = [...new Set(recent.map((e) => e.grade?.name).filter((name): name is string => Boolean(name)))].sort()
    const subjects = [...new Set(recent.map((e) => e.subject?.name).filter((name): name is string => Boolean(name)))].sort()
    const labels = [...new Set(recent.map((e) => e.label).filter((label): label is string => Boolean(label)))].sort()
    const years = [...new Set(recent.map((e) => e.year).filter((year): year is string => Boolean(year)))].sort()
    return { grades, subjects, labels, years }
  }, [recent])

  // ── Apply client-side filters ─────────────────────────────────────
  const filteredExams = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return recent.filter((exam) => {
      if (filters.grade && exam.grade?.name !== filters.grade) return false
      if (filters.subject && exam.subject?.name !== filters.subject) return false
      if (filters.label && exam.label !== filters.label) return false
      if (filters.year && exam.year !== filters.year) return false
      if (filters.status !== 'all' && exam.processingStatus !== filters.status) return false
      if (filters.search) {
        const haystack = [exam.title, exam.label, exam.grade?.name, exam.subject?.name, exam.year]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }
      return true
    })
  }, [recent, filters])

  // ── Analysis handlers ─────────────────────────────────────────────
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
      if (!res.ok || !data.success) throw new Error(data.error || `Analysis failed: ${res.status}`)

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

  // ── Render ────────────────────────────────────────────────────────
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-gray-500">Loading session...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
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

        {/* Error Banners */}
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

        {/* Filters */}
        {!loading && recent.length > 0 && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            options={filterOptions}
            resultCount={filteredExams.length}
            totalCount={recent.length}
          />
        )}

        {/* Table Card */}
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
            <ExamTable
              exams={filteredExams}
              showDevColumn={showDevColumn}
              analyzingId={analyzingId}
              onAnalyze={handleAnalyze}
              onViewAnalysis={openAnalysis}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedAnalysis && (
        <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
      )}
    </div>
  )
}
