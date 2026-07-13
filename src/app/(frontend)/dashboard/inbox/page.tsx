'use client'

import { useEffect, useState, useCallback } from 'react'
import AnalysisEditorModal from '@/components/inbox/AnalysisEditorModal'
import ReviewConvertModal from '@/components/inbox/ReviewConvertModal'
import type { AIAnalysis, Exam } from '@/types/pendingExams'

function timeAgo(dateString: string | Date): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }

  return 'just now'
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [reviewExam, setReviewExam] = useState<Exam | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all')

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

  const filteredExams = recent.filter((exam) => {
    const matchesSearch = exam.filename.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'processed'
          ? exam.processed
          : !exam.processed

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[800px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-3xl font-bold text-[#111827]">Inbox</h1>
              <span className="bg-[#e0e7ff] text-[#4338ca] px-2 py-0.5 rounded-[6px] text-xs font-semibold">
                {filteredExams?.length || 0} Documents
              </span>
            </div>
          </div>

          <form onSubmit={handleSync}>
            <button
              disabled={syncing}
              className={`px-3.5 py-2 text-white border-none rounded-[6px] font-semibold text-[13px] transition ${
                syncing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#2563eb] hover:bg-blue-700 cursor-pointer'
              }`}
            >
              {syncing ? 'Syncing...' : 'Sync Google Drive'}
            </button>
          </form>
        </div>

        {/* Main Table Card Wrapper */}
        <div className="bg-white rounded-lg p-[16px_20px] border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-4 text-base font-semibold text-[#374151]">Pending Exams</h3>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Search filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-md px-2.5 py-1 text-xs w-[180px]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'processed' | 'pending')}
              className="border border-gray-200 rounded-md px-2.5 py-1 text-xs bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Filename
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Status
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Size
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      AI
                    </th>
                    <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Uploaded
                    </th>
                    <th className="text-right py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExams.map((item) => (
                    <tr key={item.id} className="border-b border-[#f3f4f6] align-middle">
                      <td className="py-3 text-sm text-[#374151]">
                        <a
                          href={item.driveUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#111827] font-bold no-underline hover:text-[#2563eb] transition-colors group"
                          title="Open in new tab"
                        >
                          {item.filename}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#9ca3af] group-hover:text-[#2563eb] transition-colors flex-shrink-0"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </td>

                      <td className="py-3 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-xs font-medium ${
                            item.processed
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : 'bg-[#fef3c7] text-[#92400e]'
                          }`}
                        >
                          {item.processed ? 'Processed' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 text-sm text-[#374151]">
                        {item.filesize ? `${Math.round(item.filesize / 1024)} KB` : '-'}
                      </td>

                      <td className="py-3 text-sm">
                        {item.aiAnalysis ? (
                          <button
                            onClick={() => {
                              console.log(item.aiAnalysis)
                              setEditingExam(item)
                            }}
                            className="px-3 py-1.5 bg-[#f5f7ff] text-[#4f46e5] border border-[#e0e7ff] rounded-[20px] cursor-pointer font-semibold text-xs inline-flex items-center gap-1 transition-all duration-200 no-underline"
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            disabled={analyzingId === item.id}
                            className={`px-3 py-1.5 text-white border-none rounded-[20px] cursor-pointer font-semibold text-xs transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(99,102,241,0.2)] ${
                              analyzingId === item.id
                                ? 'opacity-70 cursor-not-allowed bg-[#9ca3af] shadow-none'
                                : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7]'
                            }`}
                            onClick={async () => {
                              setAnalyzingId(item.id)
                              try {
                                const res = await fetch('/api/analyze-pending-exam', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ examId: item.id }),
                                })
                                if (!res.ok) throw new Error(await res.text())
                                const data = await res.json()
                                if (data.aiAnalysis) {
                                  setRecent((prev) =>
                                    prev.map((exam) =>
                                      exam.id === item.id
                                        ? { ...exam, aiAnalysis: data.aiAnalysis }
                                        : exam,
                                    ),
                                  )
                                  showToast('Analysis complete', 'success')
                                }
                              } catch (err) {
                                const message =
                                  err instanceof Error ? err.message : 'Analysis failed'
                                showToast(message, 'error')
                              } finally {
                                setAnalyzingId(null)
                              }
                            }}
                          >
                            {analyzingId === item.id ? '...' : '✨ Analyze'}
                          </button>
                        )}
                      </td>

                      <td
                        className="py-3 text-sm text-[#6b7280]"
                        title={item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : ''}
                      >
                        {item.uploadedAt ? timeAgo(item.uploadedAt) : '-'}
                      </td>

                      <td className="py-3 text-sm text-right font-semibold text-gray-700">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            className="px-3 py-1 border rounded-[6px] text-xs transition bg-transparent text-[#6b7280] border-[#d1d5db] hover:bg-gray-50"
                            onClick={() => setReviewExam(item)}
                          >
                            Review & Convert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty states */}
          {!loading && recent.length === 0 && (
            <div className="text-center py-8 text-sm text-[#6b7280] border border-dashed border-gray-200 rounded-md mt-4">
              No inbox items yet
            </div>
          )}

          {!loading && filteredExams.length === 0 && recent.length > 0 && (
            <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-md mt-4">
              No exams match your filters
            </div>
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 animate-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
