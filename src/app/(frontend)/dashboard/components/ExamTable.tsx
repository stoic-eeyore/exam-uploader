'use client'

import Link from 'next/link'
import { Exam, ProcessingStatus } from '../types'
import { StatusBadge } from './StatusBadge'

type ExamTableProps = {
  exams: Exam[]
  showDevColumn: boolean
  analyzingId: number | null
  onAnalyze: (exam: Exam) => void
  onViewAnalysis: (analysis: string | null | undefined, examId: number) => void
}

const canAnalyze = (status?: ProcessingStatus) => {
  return status === 'uploaded' || status === 'completed' || status === 'failed'
}

export function ExamTable({ exams, showDevColumn, analyzingId, onAnalyze, onViewAnalysis }: ExamTableProps) {
  if (exams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium mb-2">No exams match your filters</p>
        <p className="text-sm">Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#f3f4f6]">
            <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">Grade</th>
            <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">Subject</th>
            <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">Label</th>
            <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">Year</th>
            <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">Status</th>
            {showDevColumn && (
              <th className="text-left py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">AI</th>
            )}
            <th className="text-right py-2.5 text-[#6b7280] text-[11px] uppercase tracking-normal">File</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id} className="border-b border-[#f3f4f6] align-middle hover:bg-gray-50 transition-colors">
              <td className="py-3 text-sm text-[#374151]">
                <strong className="font-bold">{exam.grade?.name || '-'}</strong>
              </td>
              <td className="py-3 text-sm text-[#374151]">{exam.subject?.name || '-'}</td>
              <td className="py-3 text-sm text-[#374151]">
                {exam.label ? (
                  <span className="bg-[#f3f4f6] text-[#374151] px-2 py-0.5 rounded-[4px] text-xs">{exam.label}</span>
                ) : '-'}
              </td>
              <td className="py-3 text-sm text-[#374151]">{exam.year || '-'}</td>
              <td className="py-3">
                <StatusBadge status={exam.processingStatus} />
              </td>
              {showDevColumn && (
                <td className="py-3 text-sm text-[#374151]">
                  {exam.aiAnalysis ? (
                    <button
                      data-exam-id={exam.id}
                      onClick={() => onViewAnalysis(exam.aiAnalysis, exam.id)}
                      className="px-3 py-1.5 bg-[#f5f7ff] text-[#4f46e5] border border-[#e0e7ff] rounded-[20px] cursor-pointer font-semibold text-xs inline-flex items-center gap-1 transition-all duration-200 no-underline hover:bg-[#eef0ff]"
                    >
                      View Analysis
                    </button>
                  ) : (
                    <button
                      disabled={analyzingId === exam.id || !canAnalyze(exam.processingStatus)}
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
                      onClick={() => onAnalyze(exam)}
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
                  ) : '-'}
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
  )
}

