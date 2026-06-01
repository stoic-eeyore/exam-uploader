'use client'

import { useState } from 'react'

export default function ReextractButton({ questionId }: { questionId: string }) {
  const [instructions, setInstructions] = useState('')

  async function handleSubmit() {
    await fetch(`/api/questions/${questionId}/reextract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructions,
      }),
    })
  }

  return (
    <div className="mt-2">
      <input
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Diagram missing..."
        className="border p-2"
      />

      <button onClick={handleSubmit} className="ml-2 rounded bg-blue-600 px-3 py-2 text-white">
        Re-extract
      </button>
    </div>
  )
}
