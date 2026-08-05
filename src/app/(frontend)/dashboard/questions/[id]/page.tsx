import { getQuestion } from '@/lib/questions/getQuestion'

import { QuestionContentCard } from './components/QuestionContentCard'
import { AIAnalysisCard } from './components/AIAnalysisCard'
import { listSubjects } from '@/lib/subjects/listSubjects'
import { listGrades } from '@/lib/grades/listGrades'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params

  const [question, grades, subjects] = await Promise.all([
    getQuestion(Number(id)),
    listGrades(),
    listSubjects(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Question #{question.questionNumber}</h1>

        <p className="text-muted-foreground">{question.examTitle}</p>
      </div>

      <QuestionContentCard question={question} grades={grades} subjects={subjects} />

      <AIAnalysisCard question={question} />
    </div>
  )
}
