import type { StimulusFormData } from '@/types/stimulus'

export async function updateStimulusApi(id: number, data: StimulusFormData): Promise<void> {
  const response = await fetch(`/api/stimuli/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update stimulus')
  }
}
