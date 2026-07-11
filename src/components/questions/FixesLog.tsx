'use client'

import { useState } from 'react'
import { Wrench, Plus, X, User, Clock } from 'lucide-react'

interface FixesLogProps {
  question: any
}

export default function FixesLog({ question }: FixesLogProps) {
  const [fixes, setFixes] = useState(question.fixes || [])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!draft.trim()) return
    setSaving(true)

    try {
      const res = await fetch(`/api/questions/${question.id}/fixes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: draft }),
      })
      const data = await res.json()
      setFixes(data.fixes || [])
      setDraft('')
      setAdding(false)
    } catch (err) {
      console.error('Failed to add fix:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(index: number) {
    const updated = fixes.filter((_: any, i: number) => i !== index)

    try {
      const res = await fetch(`/api/questions/${question.id}/fixes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixes: updated }),
      })
      const data = await res.json()
      setFixes(data.fixes || [])
    } catch (err) {
      console.error('Failed to remove fix:', err)
    }
  }

  if (!adding) {
    return (
      <div>
        {fixes.length > 0 && (
          <div className="space-y-2 mb-3">
            {fixes.map((fix: any, index: number) => (
              <div key={index} className="group">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                  <Wrench size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-amber-800">{fix.note}</p>
                    {fix.fixedBy && (
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-amber-600">
                        <span className="inline-flex items-center gap-1">
                          <User size={10} />
                          {fix.fixedBy.name || fix.fixedBy.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={10} />
                          {fix.fixedAt ? new Date(fix.fixedAt).toISOString().split('T')[0] : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(index)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition p-0.5 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition"
        >
          <Plus size={14} />
          {fixes.length > 0 ? 'Add another fix' : 'Log a fix'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. Fixed spelling error in option C"
        rows={3}
        className="w-full text-[13px] border border-gray-200 rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleAdd()}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setAdding(false)
            setDraft('')
          }}
          className="text-[13px] px-3 py-1.5 text-gray-600 hover:text-gray-900 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !draft.trim()}
          className="text-[13px] px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition disabled:opacity-50"
        >
          {saving ? '...' : 'Save fix'}
        </button>
      </div>
    </div>
  )
}
