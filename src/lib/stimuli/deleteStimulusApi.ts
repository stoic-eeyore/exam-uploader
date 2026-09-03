export async function deleteStimulusApi(stimulusId: number) {
  const response = await fetch(`/api/stimuli/${stimulusId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete stimulus')
  }
}
