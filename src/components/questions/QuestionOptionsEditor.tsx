'use client'

import { Plus, Trash2 } from 'lucide-react'

interface Props {
  options: {
    text: string | null
  }[]

  onChange: (
    options: {
      text: string | null
    }[],
  ) => void
}

export default function QuestionOptionsEditor({ options, onChange }: Props) {
  function updateOption(index: number, text: string) {
    const updated = [...options]
    updated[index] = {
      ...updated[index],
      text,
    }

    onChange(updated)
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function addOption() {
    onChange([
      ...options,
      {
        text: '',
      },
    ])
  }

  return (
    <div>
      <label className="block mb-3 text-sm font-medium text-gray-700">Options</label>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="w-8 pt-2.5 text-sm font-bold text-gray-400">
              {String.fromCharCode(65 + index)}
            </div>

            <textarea
              value={option.text ?? ''}
              onChange={(e) => updateOption(index, e.target.value)}
              rows={3}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              type="button"
              onClick={() => removeOption(index)}
              className="mt-2 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
              title="Remove option"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
      >
        <Plus size={14} />
        Add Option
      </button>
    </div>
  )
}
