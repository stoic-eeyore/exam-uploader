'use client'

import { useEffect, useState, useCallback } from 'react'
import AnalysisEditorModal from './AnalysisEditorModal'
import ReviewConvertModal from './ReviewConvertModal'
import InboxHeader from './InboxHeader'
import InboxFilters from './InboxFilters'
import InboxTable from './InboxTable'
import InboxSkeleton from './InboxSkeleton'
import InboxEmptyState from './InboxEmptyState'
import InboxToast from './InboxToast'
import type { AIAnalysis, Exam } from '@/types/pendingExams'

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set())
  const [reviewExam, setReviewExam] = useState<Exam | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [search, setSearch] = useState('')

  type StatusFilter = 'all' | 'new' | 'processed' | 'archived'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new')

  const STATUS_FILTERS = {
    all: () => true,
    new: (e: Exam) => e.status === 'new',
    processed: (e: Exam) => e.status === 'processed',
    archived: (e: Exam) => e.status === 'archived',
  } as const

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchPendingExams = async () => {
    try {
      const res = await fetch('/api/pending-exams?sort=-updatedAt')
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = await res.json()
      setRecent(data.docs || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exams'
      console.error('Failed to fetch pending exams:', err)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingExams()
  }, [])

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault()
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-pending', { method: 'POST' })
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
      showToast('Inbox synced successfully', 'success')
      await fetchPendingExams()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      console.error(err)
      showToast(message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const startAnalyzing = (id: number) => {
    setAnalyzingIds((prev) => new Set(prev).add(id))
  }

  const stopAnalyzing = (id: number) => {
    setAnalyzingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAnalyze = async (exam: Exam) => {
    startAnalyzing(exam.id)
    try {
      const res = await fetch('/api/analyze-pending-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (data.aiAnalysis) {
        setRecent((prev) =>
          prev.map((e) => (e.id === exam.id ? { ...e, aiAnalysis: data.aiAnalysis } : e)),
        )
        showToast('Analysis complete', 'success')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      showToast(message, 'error')
    } finally {
      stopAnalyzing(exam.id)
    }
  }

  const [archivingIds, setArchivingIds] = useState<Set<number>>(new Set())

  const startArchiving = (id: number) => {
    setArchivingIds((prev) => new Set(prev).add(id))
  }

  const stopArchiving = (id: number) => {
    setArchivingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleArchive = async (exam: Exam) => {
    startArchiving(exam.id)
    try {
      const res = await fetch(`/api/pending-exams/${exam.id}/archive`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(await res.text())

      // Update local state to archived
      setRecent((prev) => prev.map((e) => (e.id === exam.id ? { ...e, status: 'archived' } : e)))
      showToast('Exam archived', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Archive failed'
      showToast(message, 'error')
    } finally {
      stopArchiving(exam.id)
    }
  }

  const filteredExams = recent.filter((exam) => {
    const matchesSearch = exam.filename.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = STATUS_FILTERS[statusFilter](exam)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[800px] mx-auto">
        <InboxHeader count={filteredExams.length} syncing={syncing} onSync={handleSync} />

        <div className="bg-white rounded-lg p-[16px_20px] border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-4 text-base font-semibold text-[#374151]">Pending Exams</h3>

          <InboxFilters
            search={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
          />

          {loading ? (
            <InboxSkeleton />
          ) : filteredExams.length > 0 ? (
            <InboxTable
              exams={filteredExams}
              analyzingIds={analyzingIds}
              archivingIds={archivingIds}
              onAnalyze={handleAnalyze}
              onViewAnalysis={(exam) => setEditingExam(exam)}
              onReview={(exam) => setReviewExam(exam)}
              onArchive={handleArchive}
            />
          ) : (
            <InboxEmptyState hasFilters={recent.length > 0} />
          )}

          <AnalysisEditorModal
            exam={editingExam}
            open={!!editingExam}
            onClose={() => setEditingExam(null)}
            onSaved={(updatedExam) => {
              setRecent((prev) =>
                prev.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam)),
              )
            }}
          />

          <ReviewConvertModal
            exam={reviewExam}
            onClose={() => setReviewExam(null)}
            onConverted={(examId) => {
              setRecent((prev) => prev.filter((x) => x.id !== examId))
              showToast('Exam converted successfully', 'success')
            }}
          />
        </div>
      </div>

      <InboxToast toast={toast} />
    </div>
  )
}
