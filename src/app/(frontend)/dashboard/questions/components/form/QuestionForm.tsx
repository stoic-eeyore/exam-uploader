'use client'

import { useState } from 'react'
import type { QuestionFormData } from '@/lib/questions/types'

interface Props {
  initialData: QuestionFormData
  onSave: (data: QuestionFormData) => Promise<void>
}

export function QuestionForm({ initialData, onSave }: Props) {
  const [form, setForm] = useState<QuestionFormData>(initialData)

  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setSaving(true)

    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* fields */}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
