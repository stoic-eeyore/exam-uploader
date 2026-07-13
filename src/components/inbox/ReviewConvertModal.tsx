'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useExamOptions } from '@/hooks/useExamOptions'
import type { Exam } from '@/types/pendingExams'

type Props = {
  exam: Exam | null
  onClose: () => void
  onConverted: (examId: number) => void
}

const currentYear = new Date().getFullYear()
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const start = currentYear - i
  return `${start}/${start + 1}`
})

export default function ReviewConvertModal({ exam, onClose, onConverted }: Props) {
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: '',
    year: '',
    gradeId: '',
    subjectId: '',
  })

  const { grades, subjects, loading } = useExamOptions()

  useEffect(() => {
    if (!exam?.aiAnalysis) return

    setError(null)
    setForm({
      label: exam.aiAnalysis.label || '',
      year: exam.aiAnalysis.year || '2025/2026',
      gradeId: String(exam.aiAnalysis.gradeId || ''),
      subjectId: String(exam.aiAnalysis.subjectId || ''),
    })
  }, [exam])

  if (!exam) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-title" className="text-xl font-bold mb-1">
          Review Exam
        </h2>

        <p className="text-sm text-gray-500 mb-6">{exam.filename}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <select
              value={form.gradeId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gradeId: e.target.value,
                }))
              }
              disabled={loading}
              className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{loading ? 'Loading...' : 'Select grade'}</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  subjectId: e.target.value,
                }))
              }
              disabled={loading}
              className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{loading ? 'Loading...' : 'Select subject'}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              value={form.label}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  label: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              value={form.year}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  year: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select year</option>
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={converting}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            disabled={converting || loading || !form.gradeId || !form.subjectId || !form.year}
            className={`px-4 py-2 rounded-lg text-white inline-flex items-center ${
              converting || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={async () => {
              setConverting(true)
              setError(null)

              try {
                const res = await fetch('/api/convert-pending-exam', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    pendingExamId: exam.id,
                    label: form.label,
                    year: form.year,
                    grade: Number(form.gradeId),
                    subject: Number(form.subjectId),
                  }),
                })

                const data = await res.json()

                if (!res.ok) {
                  throw new Error(data.error || 'Conversion failed')
                }

                onConverted(exam.id)
                onClose()
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Conversion failed'
                setError(message)
                console.error(err)
              } finally {
                setConverting(false)
              }
            }}
          >
            {converting ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                Converting...
              </>
            ) : (
              'Confirm Convert'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
