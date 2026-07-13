'use client'

import type { Exam } from '@/types/pendingExams'

type Props = {
  exam: Exam
  isAnalyzing: boolean
  onAnalyze: (exam: Exam) => void
  onViewAnalysis: (exam: Exam) => void
  onReview: (exam: Exam) => void
  onArchive: (exam: Exam) => void
  isArchiving: boolean
}

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

export default function InboxTableRow({
  exam,
  isAnalyzing,
  onAnalyze,
  onViewAnalysis,
  onReview,
  onArchive,
  isArchiving,
}: Props) {
  return (
    <tr className="border-b border-[#f3f4f6] align-middle">
      <td className="py-3 text-sm text-[#374151]">
        <a
          href={exam.driveUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#111827] font-bold no-underline hover:text-[#2563eb] transition-colors group"
          title="Open in new tab"
        >
          {exam.filename}
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
            exam.status === 'processed'
              ? 'bg-[#dcfce7] text-[#166534]'
              : exam.status === 'archived'
                ? 'bg-[#f3f4f6] text-[#6b7280]'
                : 'bg-[#fef3c7] text-[#92400e]'
          }`}
        >
          {exam.status === 'new' ? 'New' : exam.status === 'processed' ? 'Processed' : 'Archived'}
        </span>{' '}
      </td>

      <td className="py-3 text-sm text-[#374151]">
        {exam.filesize ? `${Math.round(exam.filesize / 1024)} KB` : '-'}
      </td>

      <td className="py-3 text-sm">
        {exam.aiAnalysis ? (
          <button
            onClick={() => onViewAnalysis(exam)}
            className="px-3 py-1.5 bg-[#f5f7ff] text-[#4f46e5] border border-[#e0e7ff] rounded-[20px] cursor-pointer font-semibold text-xs inline-flex items-center gap-1 transition-all duration-200 no-underline"
          >
            View Analysis
          </button>
        ) : (
          <button
            disabled={isAnalyzing}
            className={`px-3 py-1.5 text-white border-none rounded-[20px] cursor-pointer font-semibold text-xs transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(99,102,241,0.2)] ${
              isAnalyzing
                ? 'opacity-70 cursor-not-allowed bg-[#9ca3af] shadow-none'
                : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7]'
            }`}
            onClick={() => onAnalyze(exam)}
          >
            {isAnalyzing ? '...' : '✨ Analyze'}
          </button>
        )}
      </td>

      <td
        className="py-3 text-sm text-[#6b7280]"
        title={exam.uploadedAt ? new Date(exam.uploadedAt).toLocaleString() : ''}
      >
        {exam.uploadedAt ? timeAgo(exam.uploadedAt) : '-'}
      </td>

      <td className="py-3 text-sm text-right font-semibold text-gray-700">
        <div className="flex justify-end items-center gap-2">
          <button
            className="px-3 py-1 border rounded-[6px] text-xs transition bg-transparent text-[#6b7280] border-[#d1d5db] hover:bg-gray-50"
            onClick={() => onReview(exam)}
          >
            Review & Convert
          </button>
          <button
            disabled={isArchiving}
            className={`text-xs transition opacity-60 hover:opacity-100 ${
              isArchiving ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => onArchive(exam)}
            title="Archive"
          >
            {isArchiving ? '...' : 'Archive'}
          </button>
        </div>
      </td>
    </tr>
  )
}
