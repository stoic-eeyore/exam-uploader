import type { Stimulus } from '@/payload-types'

export async function getStimulusApi(id: number): Promise<Stimulus> {
  const response = await fetch(`/api/stimuli/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch stimulus')
  }

  return response.json()
}
