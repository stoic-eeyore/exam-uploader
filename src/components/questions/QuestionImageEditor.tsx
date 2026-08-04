'use client'

interface Props {
  hasImage: boolean
  setHasImage: (value: boolean) => void

  imageUrl: string
  setImageUrl: (value: string) => void

  imagePlacement: 'auto' | 'right' | 'top' | 'inline'
  setImagePlacement: (value: 'auto' | 'right' | 'top' | 'inline') => void

  imageWidth: number
  setImageWidth: (value: number) => void
}

export default function QuestionImageEditor({
  hasImage,
  setHasImage,
  imageUrl,
  setImageUrl,
  imagePlacement,
  setImagePlacement,
  imageWidth,
  setImageWidth,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setHasImage(!hasImage)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
      >
        <div>
          <h3 className="font-medium text-gray-900">Image</h3>
          <p className="text-xs text-gray-500">{hasImage ? 'Image enabled' : 'No image'}</p>
        </div>

        <div className="text-2xl text-gray-400">{hasImage ? '−' : '+'}</div>
      </button>

      {hasImage && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Image URL</label>

            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Placement</label>

              <select
                value={imagePlacement}
                onChange={(e) => setImagePlacement(e.target.value as 'auto' | 'right')}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm"
              >
                <option value="right">Right</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Width</label>

              <input
                type="number"
                value={imageWidth}
                onChange={(e) => setImageWidth(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm"
              />
            </div>
          </div>

          {imageUrl && <img src={imageUrl} className="max-w-xs rounded border" alt="" />}
        </div>
      )}
    </div>
  )
}
