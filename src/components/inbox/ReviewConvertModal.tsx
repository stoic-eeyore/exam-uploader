'use client'

import { useEffect, useState } from 'react'
import { useExamOptions } from '@/hooks/useExamOptions'
import type { Exam } from '@/types/pendingExams'

type Props = {
  exam: Exam | null
  converting: boolean
  onClose: () => void
  onConverted: (examId: number) => void
  setConvertingId: (id: number | null) => void
}

// Generate a list of academic years (e.g., ["2023/2024", "2024/2025", "2025/2026", "2026/2027"])
const currentYear = new Date().getFullYear()
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const start = currentYear - i
  return `${start}/${start + 1}`
})

export default function ReviewConvertModal({
  exam,
  converting,
  onClose,
  onConverted,
  setConvertingId,
}: Props) {
  const [form, setForm] = useState({
    label: '',
    year: '',
    gradeId: '',
    subjectId: '',
  })

  const { grades, subjects, loading } = useExamOptions()

  useEffect(() => {
    if (!exam?.aiAnalysis) return

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
    >
      <div
        //className="bg-white text-black w-full max-w-sm border border-black p-4 font-mono text-xs shadow-md"
        className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">Review Exam</h2>

        <p className="text-sm text-gray-500 mb-6">{exam.filename}</p>

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
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Select grade</option>

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
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Select subject</option>

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
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button
            disabled={converting}
            className={`px-4 py-2 rounded-lg text-white ${
              converting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={async () => {
              try {
                setConvertingId(exam.id)

                const res = await fetch('/api/convert-pending-exam', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
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
                  alert(data.error || 'Conversion failed')
                  return
                }

                onConverted(exam.id)
                onClose()
              } catch (err) {
                console.error(err)
                alert('Conversion failed')
              } finally {
                setConvertingId(null)
              }
            }}
          >
            {converting ? 'Converting...' : 'Confirm Convert'}
          </button>
        </div>
      </div>
    </div>
  )
}
