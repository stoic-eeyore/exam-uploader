'use client'

import { useEffect, useState } from 'react'
import type { Exam } from '@/types/pendingExam'

type Props = {
  exam: Exam | null
  open: boolean
  onClose: () => void
  onSaved: (updatedExam: Exam) => void
}

export default function AnalysisEditorModal({
  exam,
  open,
  onClose,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    label: '',
    year: '',
    grade: '',
    subject: '',
    confidence: '',
  })

  useEffect(() => {
    if (!exam?.aiAnalysis) return

    setForm({
      label: exam.aiAnalysis.label || '',
      year: String(exam.aiAnalysis.year || ''),
      grade: exam.aiAnalysis.grade || '',
      subject: exam.aiAnalysis.subject || '',
      confidence: String(exam.aiAnalysis.confidence || ''),
    })
  }, [exam])

  if (!open || !exam) return null

  async function handleSave() {
    try {
      setSaving(true)

      const res = await fetch(`/api/pending-exams/${exam.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiAnalysis: {
            label: form.label,
            year: Number(form.year),
            grade: form.grade,
            subject: form.subject,
            confidence: Number(form.confidence),
          },
        }),
      })

      const updatedExam = await res.json()

      if (!res.ok) {
        alert(updatedExam.errors?.[0]?.message || 'Failed to save analysis')
        return
      }

      onSaved(updatedExam.doc || updatedExam)

      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to save analysis')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit AI Analysis
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {exam.filename}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Label
            </label>

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
            <label className="block text-sm font-medium mb-1">
              Year
            </label>

            <input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  year: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Grade
            </label>

            <input
              value={form.grade}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  grade: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Subject
            </label>

            <input
              value={form.subject}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confidence
            </label>

            <input
              type="number"
              step="0.01"
              value={form.confidence}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  confidence: e.target.value,
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-white ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}

