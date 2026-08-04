import { getQuestion } from '@/lib/questions/getQuestion'
import { mapQuestionToForm } from '@/lib/questions/mapQuestionDetail'

import { QuestionForm } from '../../components/form/QuestionForm'

import { updateQuestionAction } from './actions'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params

  const question = await getQuestion(Number(id))

  return (
    <QuestionForm
      initialData={mapQuestionToForm(question)}
      onSave={(data) => updateQuestionAction(Number(id), data)}
    />
  )
}
