'use client'

import { useState, useCallback } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import ExtractButton from '@/components/exams/ExtractButton'
import ReviewQuestionsButton from '@/components/exams/ReviewQuestionsButton'

type Grade = { id: string; name: string }
type Subject = { id: string; name: string }

type ExamMetadata = {
  id: string | number
  title: string
  year?: string
  label?: string
  filename?: string
  processingStatus?: string
  reviewedByAI?: boolean
  grade?: any
  subject?: any
  driveFileId?: string | null
}

export default function ExamMetadataEditor({ exam }: { exam: ExamMetadata }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: exam.title || '',
    year: exam.year || '',
    label: exam.label || '',
    grade: typeof exam.grade === 'object' ? exam.grade?.id : exam.grade,
    subject: typeof exam.subject === 'object' ? exam.subject?.id : exam.subject,
  })

  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false)
  const [dropdownsLoading, setDropdownsLoading] = useState(false)

  const loadDropdowns = useCallback(async () => {
    if (dropdownsLoaded) return
    setDropdownsLoading(true)
    try {
      const [gRes, sRes] = await Promise.all([
        fetch('/api/grades?limit=100'),
        fetch('/api/subjects?limit=100'),
      ])
      const gData = await gRes.json()
      const sData = await sRes.json()
      setGrades(gData.docs || [])
      setSubjects(sData.docs || [])
      setDropdownsLoaded(true)
    } catch (err) {
      setError('Failed to load dropdown options')
    } finally {
      setDropdownsLoading(false)
    }
  }, [dropdownsLoaded])

  const enterEditMode = () => {
    setError(null)
    loadDropdowns()
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          year: formData.year,
          label: formData.label,
          grade: Number(formData.grade) || undefined,
          subject: Number(formData.subject) || undefined,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to save changes')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setFormData({
      title: exam.title || '',
      year: exam.year || '',
      label: exam.label || '',
      grade: typeof exam.grade === 'object' ? exam.grade?.id : exam.grade,
      subject: typeof exam.subject === 'object' ? exam.subject?.id : exam.subject,
    })
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm text-gray-500">
              {typeof exam.grade === 'object' ? exam.grade?.name : exam.grade}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              {typeof exam.subject === 'object' ? exam.subject?.name : exam.subject}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{exam.year}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{exam.label}</span>
          </div>
          {exam.filename && <p className="text-xs text-gray-400 mt-0.5">{exam.filename}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={enterEditMode}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>
          {exam.processingStatus === 'uploaded' && <ExtractButton examId={Number(exam.id)} />}
          {!exam.reviewedByAI && <ReviewQuestionsButton examId={Number(exam.id)} />}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Exam title"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              disabled={dropdownsLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{dropdownsLoading ? 'Loading...' : 'Select Grade'}</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              disabled={dropdownsLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{dropdownsLoading ? 'Loading...' : 'Select Subject'}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2021/2022">2021/2022</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Formatif 1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  )
}
