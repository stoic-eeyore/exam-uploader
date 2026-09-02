'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import ImageEditor from '@/components/questions/ImageEditor'

export interface StimulusFormData {
  content: string
  images: {
    url: string
    placement: 'right' | 'auto' | 'top' | 'inline'
    width: number
    alt: string | null
  }[]
}

interface Props {
  initialData: StimulusFormData
  onSave: (data: StimulusFormData) => Promise<void>
}

export function StimulusForm({ initialData, onSave }: Props) {
  const [form, setForm] = useState<StimulusFormData>(initialData)
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
          alt: null,
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
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Stimulus Content</label>

        <textarea
          value={form.content}
          onChange={(e) =>
            setForm({
              ...form,
              content: e.target.value,
            })
          }
          rows={10}
          className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      <ImageEditor
        hasImage={hasImage}
        setHasImage={setHasImage}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        imagePlacement={imagePlacement}
        setImagePlacement={setImagePlacement}
        imageWidth={imageWidth}
        setImageWidth={setImageWidth}
      />

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
