'use client'

import { useEffect, useState } from 'react'
import type { Exam } from '@/types/pendingExams'

type Props = {
  exam: Exam | null
  open: boolean
  onClose: () => void
  onSaved: (updatedExam: Exam) => void
}

export default function AnalysisEditorModal({ exam, open, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [jsonString, setJsonString] = useState('')

  useEffect(() => {
    if (!exam?.aiAnalysis) return

    console.log('Populating form with AI analysis:', exam.aiAnalysis)
    setJsonString(JSON.stringify(exam.aiAnalysis, null, 2))
  }, [exam])

  if (!open || !exam) return null

  async function handleSave() {
    if (!exam) return

    try {
      // Validate that the user typed valid JSON syntax before hitting the API
      let parsedJson
      try {
        parsedJson = JSON.parse(jsonString)
      } catch (e) {
        alert('Invalid JSON syntax. Please check your brackets and commas.')
        return
      }

      setSaving(true)

      const res = await fetch(`/api/pending-exams/${exam.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          aiAnalysis: parsedJson,
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
        className="bg-white text-black w-full max-w-sm border border-black p-4 text-xs shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit AI Analysis</h2>

            <p className="text-sm text-gray-500 mt-1">{exam.filename}</p>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">JSON Object Data</label>
          <textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            rows={12}
            className="w-full border rounded-lg p-3 font-mono text-[11px] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="{}"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-white ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
