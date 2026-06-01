'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: string | null
  year?: string
  createdAt?: string
  grade?: {
    name: string
  }
  subject?: {
    name: string
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [totalExams, setTotalExams] = useState(0)
  const [recent, setRecent] = useState<Exam[]>([])
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [showDevColumn, setShowDevColumn] = useState(false)
  const inputSequence = useRef<string[]>([])

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch('/api/dashboard')
      const data = await res.json()

      setTotalExams(data.totalExams)
      setRecent(data.recent)

      setLoading(false)
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
        setShowDevColumn((prev) => !prev)
        console.log('🚧 Developer mode toggled:', !showDevColumn)
        inputSequence.current = []
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDevColumn])

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[800px] mx-auto">
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
              <button className="px-3.5 py-2 bg-[#2563eb] text-white border-none rounded-[6px] cursor-pointer font-semibold text-[13px]">
                + Upload
              </button>
            </Link>
            <button
              className="px-3 py-2 bg-transparent text-[#6b7280] border border-[#d1d5db] rounded-[6px] cursor-pointer text-[13px]"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Card Wrapper */}
        <div className="bg-white rounded-lg p-[16px_20px] border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <h3 className="mt-0 mb-4 text-base font-semibold text-[#374151]">Recently Uploaded</h3>
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
                    <td className="py-3 text-sm text-[#374151]">{exam.year}</td>
                    {showDevColumn && (
                      <td className="py-3 text-sm text-[#374151]">
                        {exam.aiAnalysis ? (
                          <button
                            onClick={() => {
                              console.log('bakeko')
                              console.log(exam.aiAnalysis)
                              setSelectedAnalysis(exam.aiAnalysis ?? null)
                            }}
                            className="px-3 py-1.5 bg-[#f5f7ff] text-[#4f46e5] border border-[#e0e7ff] rounded-[20px] cursor-pointer font-semibold text-xs inline-flex items-center gap-1 transition-all duration-200 no-underline"
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            disabled={analyzingId === exam.id}
                            className={`px-3 py-1.5 text-white border-none rounded-[20px] cursor-pointer font-semibold text-xs transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(99,102,241,0.2)] ${
                              analyzingId === exam.id
                                ? 'opacity-70 cursor-not-allowed bg-[#9ca3af] shadow-none'
                                : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7]'
                            }`}
                            onClick={async () => {
                              setAnalyzingId(exam.id)
                              try {
                                const res = await fetch('/api/analyze-exam', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ examId: exam.id }),
                                })
                                const data = await res.json()
                              } finally {
                                setAnalyzingId(null)
                              }
                            }}
                          >
                            {analyzingId === exam.id ? '...' : '✨ Analyze'}
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
                          className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors duration-150"
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

          {/* Frosted Glass Analysis Modal */}
          {selectedAnalysis && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-5"
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
