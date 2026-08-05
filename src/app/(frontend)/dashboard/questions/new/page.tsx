import { getPayload } from 'payload'
import config from '@payload-config'
import { QuestionForm } from '../components/form/QuestionForm'
import type { QuestionFormData } from '@/lib/questions/types'
import { createQuestion } from '@/lib/questions/createQuestion'
import { redirect } from 'next/dist/client/components/navigation'

export default async function NewQuestionPage() {
  const payload = await getPayload({ config })

  const [grades, subjects] = await Promise.all([
    payload.find({
      collection: 'grades',
      limit: 100,
      sort: 'code',
    }),
    payload.find({
      collection: 'subjects',
      limit: 100,
      sort: 'name',
    }),
  ])

  const initialData: QuestionFormData = {
    grade: null,
    subject: null,

    questionType: 'mcq',

    questionText: '',

    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],

    images: [],
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Question</h1>

      <QuestionForm
        initialData={initialData}
        grades={grades.docs}
        subjects={subjects.docs}
        onSave={async (data) => {
          'use server'

          const question = await createQuestion(data)
          redirect(`/dashboard/questions/${question.id}`)
        }}
      />
    </div>
  )
}
