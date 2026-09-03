import type { Question, Stimulus } from '@/payload-types'

export interface StimulusWithQuestions {
  stimulus: Stimulus
  questions: Question[]
}

export async function getStimulusApi(id: number): Promise<StimulusWithQuestions> {
  const response = await fetch(`/api/stimuli/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch stimulus')
  }

  return response.json()
}
