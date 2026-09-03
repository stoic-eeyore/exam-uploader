'use client'

interface Props {
  startQuestion: number
  endQuestion: number
  onStartChange: (value: number) => void
  onEndChange: (value: number) => void
}

export function StimulusQuestionRange({
  startQuestion,
  endQuestion,
  onStartChange,
  onEndChange,
}: Props) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">Affected questions</label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={startQuestion}
          onChange={(e) => onStartChange(Number(e.target.value))}
          className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <span className="text-gray-500">–</span>

        <input
          type="number"
          min={1}
          value={endQuestion}
          onChange={(e) => onEndChange(Number(e.target.value))}
          className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
