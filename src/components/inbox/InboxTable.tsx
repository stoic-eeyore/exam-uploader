'use client'

import InboxTableRow from './InboxTableRow'
import type { Exam } from '@/types/pendingExams'

type Props = {
  exams: Exam[]
  analyzingIds: Set<number>
  onAnalyze: (exam: Exam) => void
  onViewAnalysis: (exam: Exam) => void
  onReview: (exam: Exam) => void
}

export default function InboxTable({
  exams,
  analyzingIds,
  onAnalyze,
  onViewAnalysis,
  onReview,
}: Props) {
  return (
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
          {exams.map((exam) => (
            <InboxTableRow
              key={exam.id}
              exam={exam}
              isAnalyzing={analyzingIds.has(exam.id)}
              onAnalyze={onAnalyze}
              onViewAnalysis={onViewAnalysis}
              onReview={onReview}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
