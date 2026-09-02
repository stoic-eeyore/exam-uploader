'use client'

import { useState } from 'react'

export default function QuestionVisibilityToggle() {
  const [hideReviewed, setHideReviewed] = useState(false)

  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        checked={hideReviewed}
        onChange={(e) => {
          setHideReviewed(e.target.checked)

          document
            .querySelectorAll<HTMLElement>('[data-question-status="verified"]')
            .forEach((el) => {
              el.style.display = e.target.checked ? 'none' : ''
            })
        }}
        className="rounded border-gray-300"
      />
      Hide reviewed
    </label>
  )
}
