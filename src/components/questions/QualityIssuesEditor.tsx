'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'

interface QualityIssuesEditorProps {
  question: any
}

export default function QualityIssuesEditor({ question }: QualityIssuesEditorProps) {
  const [issues, setIssues] = useState(question.qualityIssues || [])
  const [adding, setAdding] = useState(false)
  const [newIssue, setNewIssue] = useState('')
  const [newSeverity, setNewSeverity] = useState('medium')
  const [saving, setSaving] = useState(false)

  const severityColor = (s: string) => {
    switch (s) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  async function handleAdd() {
    if (!newIssue.trim()) return
    setSaving(true)

    const updated = [...issues, { issue: newIssue, severity: newSeverity }]
    
    try {
      await fetch(`/api/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualityIssues: updated }),
      })
      setIssues(updated)
      setNewIssue('')
      setAdding(false)
    } catch (err) {
      console.error('Failed to add issue:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(index: number) {
    const updated = issues.filter((_: any, i: number) => i !== index)
    
    try {
      await fetch(`/api/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualityIssues: updated }),
      })
      setIssues(updated)
    } catch (err) {
      console.error('Failed to remove issue:', err)
    }
  }

  return (
    <div className="space-y-2">
      {issues.map((issue: any, index: number) => (
        <div key={index} className="flex items-start gap-2 group">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-[13px] text-red-600">{issue.issue}</span>
            <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded border ${severityColor(issue.severity)}`}>
              {issue.severity}
            </span>
          </div>
          <button
            onClick={() => handleRemove(index)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition mt-1"
        >
          <Plus size={14} />
          Add issue
        </button>
      ) : (
        <div className="flex items-start gap-2 mt-2">
          <input
            value={newIssue}
            onChange={(e) => setNewIssue(e.target.value)}
            placeholder="Describe the issue..."
            className="flex-1 text-[13px] border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={newSeverity}
            onChange={(e) => setNewSeverity(e.target.value)}
            className="text-[13px] border border-gray-200 rounded-md px-2 py-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={saving || !newIssue.trim()}
            className="text-[13px] px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {saving ? '...' : 'Add'}
          </button>
        </div>
      )}
    </div>
  )
}

