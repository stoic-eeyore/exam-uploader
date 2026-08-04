import { listQuestions } from '@/lib/questions/listQuestions'
import { QuestionList } from './components/QuestionList'

export default async function QuestionsPage() {
  const result = await listQuestions()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">{result.pagination.total} questions</p>
        </div>
      </div>

      <QuestionList questions={result.questions} />
    </div>
  )
}
