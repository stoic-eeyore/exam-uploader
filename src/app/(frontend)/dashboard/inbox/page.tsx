'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import AnalysisEditorModal from '@/components/inbox/AnalysisEditorModal'
import ReviewConvertModal from '@/components/inbox/ReviewConvertModal'
import type { AIAnalysis, Exam } from '@/types/pendingExams'

export default function InboxPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [convertingId, setConvertingId] = useState<number | null>(null)
  const [reviewExam, setReviewExam] = useState<Exam | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all')

  const fetchPendingExams = async () => {
    try {
      const res = await fetch('/api/pending-exams?sort=-updatedAt')
      const data = await res.json()

      setRecent(data.docs || [])
    } catch (err) {
      console.error('Failed to fetch pending exams:', err)
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
      if (res.ok) {
        console.log('Sync successful, updated inbox data')
        await fetchPendingExams()
      }
    } catch (err) {
      console.error(err)
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
                      <strong className="font-bold">{item.filename}</strong>
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
                            // setSelectedAnalysis(item.aiAnalysis ?? null)
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
                              const data = await res.json()
                              if (data.aiAnalysis) {
                                setRecent((prev) =>
                                  prev.map((exam) =>
                                    exam.id === item.id
                                      ? { ...exam, aiAnalysis: data.aiAnalysis }
                                      : exam,
                                  ),
                                )
                              }
                            } finally {
                              setAnalyzingId(null)
                            }
                          }}
                        >
                          {analyzingId === item.id ? '...' : '✨ Analyze'}
                        </button>
                      )}
                    </td>

                    <td className="py-3 text-sm text-[#374151]">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : '-'}
                    </td>

                    <td className="py-3 text-sm text-right font-semibold text-gray-700">
                      <div className="flex justify-end items-center gap-2">
                        <a
                          href={item.driveUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563eb] no-underline text-[13px]"
                        >
                          View
                        </a>

                        <button
                          // disabled={!item.aiAnalysis}
                          className={`px-3 py-1 border rounded-[6px] text-xs transition ${
                            // !item.aiAnalysis
                            false
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-transparent text-[#6b7280] border-[#d1d5db] hover:bg-gray-50'
                          }`}
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

          {/* Empty State Element */}
          {recent?.length === 0 && (
            <div className="text-center py-8 text-sm text-[#6b7280] border border-dashed border-gray-200 rounded-md mt-4">
              No inbox items yet
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
            converting={convertingId === reviewExam?.id}
            onClose={() => setReviewExam(null)}
            setConvertingId={setConvertingId}
            onConverted={(examId) => {
              setRecent((prev) => prev.filter((x) => x.id !== examId))
            }}
          />
        </div>
      </div>
    </div>
  )
}
