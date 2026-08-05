'use client'

import { useState } from 'react'
import type { QuestionFormData } from '@/lib/questions/types'
import { Grade, Subject } from '@/payload-types'
import QuestionOptionsEditor from '@/components/questions/QuestionOptionsEditor'
import QuestionImageEditor from '@/components/questions/QuestionImageEditor'
import { Loader2 } from 'lucide-react'

interface Props {
  initialData: QuestionFormData

  grades: Grade[]
  subjects: Subject[]

  onSave: (data: QuestionFormData) => Promise<void>
}
export function QuestionForm({ initialData, grades, subjects, onSave }: Props) {
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

  const image = form.images[0]

  const hasImage = form.images.length > 0
  const imageUrl = image?.url ?? ''
  const imagePlacement = image?.placement ?? 'right'
  const imageWidth = image?.width ?? 220

  function setImageUrl(url: string) {
    setForm({
      ...form,
      images: [
        {
          ...form.images[0],
          url,
        },
      ],
    })
  }

  function setHasImage(enabled: boolean) {
    if (!enabled) {
      setForm({
        ...form,
        images: [],
      })

      return
    }

    setForm({
      ...form,
      images: [
        {
          url: '',
          placement: 'right',
          width: 220,
          // alt: '',
        },
      ],
    })
  }

  function setImagePlacement(placement: 'auto' | 'right' | 'top' | 'inline') {
    setForm({
      ...form,
      images: [
        {
          ...form.images[0],
          placement,
        },
      ],
    })
  }

  function setImageWidth(width: number) {
    setForm({
      ...form,
      images: [
        {
          ...form.images[0],
          width,
        },
      ],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">Grade</label>

          <select
            value={form.grade ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                grade: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Select grade...</option>

            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">Subject</label>

          <select
            value={form.subject ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                subject: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Select subject...</option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Question Type</label>

        <select
          value={form.questionType}
          onChange={(e) =>
            setForm({
              ...form,
              questionType: e.target.value as 'mcq' | 'essay',
            })
          }
          className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm"
        >
          <option value="mcq">Multiple Choice</option>
          <option value="essay">Essay</option>
        </select>
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Question Text</label>

        <textarea
          value={form.questionText}
          onChange={(e) =>
            setForm({
              ...form,
              questionText: e.target.value,
            })
          }
          rows={8}
          className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      <QuestionImageEditor
        hasImage={hasImage}
        setHasImage={setHasImage}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        imagePlacement={imagePlacement}
        setImagePlacement={setImagePlacement}
        imageWidth={imageWidth}
        setImageWidth={setImageWidth}
      />

      {form.questionType === 'mcq' && (
        <QuestionOptionsEditor
          options={form.options}
          onChange={(options) =>
            setForm({
              ...form,
              options,
            })
          }
        />
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
