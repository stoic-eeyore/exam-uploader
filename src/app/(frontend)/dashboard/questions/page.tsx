import { listQuestions } from '@/lib/questions/listQuestions'
import { listGrades } from '@/lib/grades/listGrades'
import { listSubjects } from '@/lib/subjects/listSubjects'
import QuestionFilters from './components/QuestionFilters'
import { QuestionList } from './components/QuestionList'
import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    grade?: string
    subject?: string
  }>
}) {
  const params = await searchParams

  const grade = params.grade ? Number(params.grade) : undefined

  const subject = params.subject ? Number(params.subject) : undefined

  const [questionResult, grades, subjects] = await Promise.all([
    listQuestions({
      grade,
      subject,
    }),
    listGrades(),
    listSubjects(),
  ])

  return (
    <div className="min-h-screen bg-[#f9fafb] p-5 font-sans">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Questions Dashboard</h1>

          <Link
            href="/dashboard/questions/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + New Question
          </Link>
        </div>

        <>
          <QuestionFilters
            grades={grades}
            subjects={subjects}
            selectedGrade={grade}
            selectedSubject={subject}
          />

          <QuestionList questions={questionResult.questions} grades={grades} subjects={subjects} />
        </>
      </div>
    </div>
  )
}
