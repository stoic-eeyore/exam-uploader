import { getQuestion } from '@/lib/questions/getQuestion'

import { QuestionContentCard } from './components/QuestionContentCard'
import { AIAnalysisCard } from './components/AIAnalysisCard'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params

  const question = await getQuestion(Number(id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Question #{question.questionNumber}</h1>

        <p className="text-muted-foreground">{question.examTitle}</p>
      </div>

      <QuestionContentCard question={question} />

      <AIAnalysisCard question={question} />
    </div>
  )
}
