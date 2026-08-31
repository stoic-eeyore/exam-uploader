'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useExamOptions } from '@/hooks/useExamOptions'
import type { Exam } from '@/types/pendingExams'

type Props = {
  exam: Exam | null
  onClose: () => void
  onConverted: (examId: number) => void
  onVerified?: (examId: number) => void
}

const currentYear = new Date().getFullYear()
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const start = currentYear - i
  return `${start}/${start + 1}`
})

export default function ReviewConvertModal({ exam, onClose, onConverted, onVerified }: Props) {
  const [converting, setConverting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: '',
    year: '',
    gradeId: '',
    subjectId: '',
    semester: '',
  })

  const { grades, subjects, loading } = useExamOptions()

  useEffect(() => {
    if (!exam?.aiAnalysis) return

    setError(null)
    setForm({
      label: exam.aiAnalysis.label || '',
      year: exam.aiAnalysis.year || '2026/2027',
      gradeId: String(exam.aiAnalysis.gradeId || ''),
      subjectId: String(exam.aiAnalysis.subjectId || ''),
      semester: exam.aiAnalysis.semester || '',
    })
  }, [exam])

  if (!exam) return null

  const aiAnalysisText = (exam as any).aiAnalysis?.header

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="review-title" className="text-xl font-bold">
            Review Exam
          </h2>
          <p className="text-sm text-gray-500 truncate max-w-[200px]" title={exam.filename}>
            {exam.filename}
          </p>
        </div>

        {aiAnalysisText && (
          <div className="mb-5">
            <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {aiAnalysisText}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {/* Grade */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-gray-700 text-right">Grade</label>
            <select
              value={form.gradeId}
              onChange={(e) => setForm((prev) => ({ ...prev, gradeId: e.target.value }))}
              disabled={loading}
              className="w-full border rounded-lg px-3 py-1.5 bg-white disabled:bg-gray-50 disabled:text-gray-400 text-sm"
            >
              <option value="">{loading ? 'Loading...' : 'Select grade'}</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-gray-700 text-right">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              disabled={loading}
              className="w-full border rounded-lg px-3 py-1.5 bg-white disabled:bg-gray-50 disabled:text-gray-400 text-sm"
            >
              <option value="">{loading ? 'Loading...' : 'Select subject'}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-gray-700 text-right">Year</label>
            <select
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Select year</option>
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-gray-700 text-right">
              Semester <span className="text-gray-400 font-normal">(opt)</span>
            </label>
            <select
              value={form.semester}
              onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Select semester</option>
              <option value="ganjil">Ganjil (Odd)</option>
              <option value="genap">Genap (Even)</option>
            </select>
          </div>

          {/* Label */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-gray-700 text-right">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* Show hint when buttons are disabled */}
        {(!form.gradeId || !form.subjectId || !form.year) && (
          <p className="text-s text-gray-400 text-right mb-2">
            Fill in Grade, Subject, Year and Label to enable actions
          </p>
        )}

        <div className="flex justify-end gap-3 mt-3">
          <button
            onClick={onClose}
            disabled={converting || verifying}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Verify button — only enabled when all required fields are filled */}
          <button
            disabled={
              converting ||
              verifying ||
              loading ||
              !form.gradeId ||
              !form.subjectId ||
              !form.year ||
              !form.label
            }
            className={`px-4 py-2 rounded-lg inline-flex items-center ${
              converting || verifying
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
            onClick={async () => {
              if (!form.gradeId || !form.subjectId || !form.year || !form.label) {
                setError('Please fill in all required fields before verifying.')
                return
              }

              setVerifying(true)
              setError(null)

              try {
                const res = await fetch(`/api/pending-exams/${exam.id}/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    pendingExamId: exam.id,
                    label: form.label,
                    year: form.year,
                    grade: Number(form.gradeId),
                    subject: Number(form.subjectId),
                    semester: form.semester || null,
                  }),
                })

                const data = await res.json()

                if (!res.ok) {
                  throw new Error(data.error || 'Verification failed')
                }

                onVerified?.(exam.id)
                onClose()
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Verification failed'
                setError(message)
                console.error(err)
              } finally {
                setVerifying(false)
              }
            }}
          >
            {verifying ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                Verifying...
              </>
            ) : (
              'Verify Only'
            )}
          </button>

          {/* Convert button */}
          <button
            disabled={
              converting ||
              verifying ||
              loading ||
              !form.gradeId ||
              !form.subjectId ||
              !form.year ||
              !form.label
            }
            className={`px-4 py-2 rounded-lg text-white inline-flex items-center ${
              converting || verifying
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
                    semester: form.semester || null,
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
              'Convert Exam'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
