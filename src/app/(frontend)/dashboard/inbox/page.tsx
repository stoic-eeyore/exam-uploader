'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

type Exam = {
  id: number
  filename: string
  processed: boolean
  filesize?: number
  uploadedAt?: string
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: string | null
}

export default function InboxPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch('/api/pending-exams')
        const data = await res.json()
        console.log('Loaded dashboard data:', data.docs)
        console.log('Loaded dashboard data:', data)

        setRecent(data.docs)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault()
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-pending', { method: 'POST' })
      if (res.ok) {
        const dataRes = await fetch('/api/pending-exams')
        const data = await dataRes.json()
        setRecent(data.recent || [])
        console.log('Sync successful, updated inbox data')
        console.log(data.recent)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[800px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-3xl font-bold text-[#111827]">Inbox</h1>
              <span className="bg-[#e0e7ff] text-[#4338ca] px-2 py-0.5 rounded-[6px] text-xs font-semibold">
                {recent?.length || 0} Pending
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
                {recent?.map((item) => (
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
                            console.log('bakeko')
                            console.log(item.aiAnalysis)
                            setSelectedAnalysis(item.aiAnalysis ?? null)
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
                        <button className="px-3 py-1 bg-transparent text-[#6b7280] border border-[#d1d5db] rounded-[6px] cursor-pointer text-xs transition hover:bg-gray-50">
                          Convert
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

          {/* Frosted Glass Analysis Modal */}
          {selectedAnalysis && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-50 p-5"
              onClick={() => setSelectedAnalysis(null)}
            >
              <div
                className="bg-white w-full max-w-[600px] max-h-[85vh] rounded-[16px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-[16px_24px] border-b border-[#f3f4f6] flex justify-between items-center bg-white">
                  <h2 className="m-0 text-lg font-bold text-gray-900">AI Analysis Results</h2>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="bg-[#f3f4f6] border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-[#6b7280] text-xl transition-colors duration-200 hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm leading-[1.6] text-[#374151] bg-[#fdfdfd] font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedAnalysis, null, 2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
