'use server'

import { redirect } from 'next/navigation'

import { updateQuestion } from '@/lib/questions/updateQuestion'
import type { QuestionFormData } from '@/lib/questions/types'

export async function updateQuestionAction(id: number, data: QuestionFormData) {
  await updateQuestion(id, data)

  redirect(`/dashboard/questions/${id}`)
}
