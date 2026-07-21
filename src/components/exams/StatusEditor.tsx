'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Pencil, X, Check, Loader2 } from 'lucide-react'

type ProcessingStatus =
  | 'uploaded'
  | 'extracting'
  | 'review'
  | 'consultation'
  | 'completed'
  | 'failed'

const STATUS_OPTIONS: { value: ProcessingStatus; label: string; warning?: string }[] = [
  { value: 'uploaded', label: 'Uploaded', warning: 'Will reset extraction progress' },
  { value: 'extracting', label: 'Extracting', warning: 'May conflict with active workers' },
  { value: 'review', label: 'Ready for Review' },
  {
    value: 'consultation',
    label: 'Pending Consultation',
    warning: 'Marks exam as ready for consultation',
  },
  { value: 'completed', label: 'Completed', warning: 'Marks exam as fully processed' },
  { value: 'failed', label: 'Failed', warning: 'May trigger retry workflows' },
]

type StatusEditorProps = {
  examId: string
  currentStatus: ProcessingStatus
}

export default function StatusEditor({ examId, currentStatus }: StatusEditorProps) {
  const [editing, setEditing] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ProcessingStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const selectedOption = STATUS_OPTIONS.find((s) => s.value === pendingStatus)

  const handleSave = async () => {
    if (pendingStatus === currentStatus) {
      setEditing(false)
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/exams/${examId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processingStatus: pendingStatus }),
      })

      if (!res.ok) throw new Error(`Failed: ${res.status}`)

      router.refresh()
      setEditing(false)
    } catch (err) {
      console.error('Status update failed:', err)
      alert('Failed to update status. Check console.')
      setPendingStatus(currentStatus)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPendingStatus(currentStatus)
    setEditing(false)
  }

  // ── View mode: subtle edit button ───────────────────────────────
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors group"
        title="Manually edit status"
      >
        <Pencil size={12} className="group-hover:scale-110 transition-transform" />
        <span className="underline decoration-dotted"></span>
      </button>
    )
  }

  // ── Edit mode: conspicuous, friction-heavy ──────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.15s_ease-out]">
        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Current Status
            </label>
            <div className="text-sm font-medium text-gray-400 line-through">
              {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              New Status
            </label>
            <select
              value={pendingStatus}
              onChange={(e) => setPendingStatus(e.target.value as ProcessingStatus)}
              disabled={saving}
              className="w-full text-sm font-medium border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contextual warning */}
          {selectedOption?.warning && pendingStatus !== currentStatus && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {selectedOption.warning}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || pendingStatus === currentStatus}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Confirm Change
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
