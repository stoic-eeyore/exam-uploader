import config from '@payload-config'
import { getPayload } from 'payload'
import ExtractButton from '@/components/exams/ExtractButton'
import ReextractButton from '@/components/exams/ReextractButton'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import ReviewSuggestionModal from '@/components/questions/ReviewSuggestionModal'
import EditQuestionModal from '@/components/questions/EditQuestionModal'
import ReviewQuestionsButton from '@/components/exams/ReviewQuestionsButton'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({
    config,
  })

  const exam = await payload.findByID({
    collection: 'exams',
    id,
    depth: 2,
  })

  const questions = await payload.find({
    collection: 'questions',
    where: {
      exam: {
        equals: id,
      },
    },
    limit: 500,

    sort: ['questionType', 'questionNumber'],
  })

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          Exams
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{exam.filename}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {exam.processingStatus === 'uploaded' && <ExtractButton examId={exam.id} />}
            {!exam.reviewedByAI && <ReviewQuestionsButton examId={exam.id} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Total Questions</div>
          <div className="text-lg font-bold">{questions.totalDocs}</div>
        </div>

        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-bold">{exam.processingStatus}</div>
        </div>

        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Link</div>
          <div className="text-lg font-bold">
            {exam.driveUrl ? (
              <a href={exam.driveUrl} target="_blank" rel="noreferrer">
                Open
              </a>
            ) : (
              'Not uploaded'
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.docs.map((question) => {
          const qualityIssues = question.qualityIssues ?? []

          return (
            <div key={question.id} className="rounded border p-4 shadow-sm bg-white space-y-3">
              <ReextractButton questionId={question.id} />

              <div className="flex items-start gap-3">
                <span className="font-bold text-gray-900 min-w-[2.5rem] text-sm">
                  Q{question.questionNumber}
                </span>

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {question.cognitiveLevel && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs">
                        {question.cognitiveLevel}
                      </span>
                    )}

                    {qualityIssues.length > 0 && (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                        {qualityIssues.length} issue(s)
                      </span>
                    )}
                  </div>

                  {qualityIssues.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {qualityIssues.map((issue: any, index: number) => (
                        <div key={index} className="text-[13px] text-red-600">
                          ⚠ {issue.issue}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="prose max-w-none text-gray-800 text-[15px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {question.questionText}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {question.questionType === 'mcq' && question.options && (
                <div className="grid grid-cols-1 gap-2 pl-[3.25rem] sm:grid-cols-2">
                  {question.options.map((option: any, index: number) => {
                    const choiceLetter = String.fromCharCode(65 + index)

                    return (
                      <div
                        key={option.id || index}
                        className="flex items-start gap-2 rounded-md border bg-gray-50/50 p-2 text-[13px] text-gray-600"
                      >
                        <span className="font-bold text-gray-400">{choiceLetter}.</span>

                        <div className="flex-1 prose max-w-none text-[13px]">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {option.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  })}

                  {question.suggestedQuestionText && <ReviewSuggestionModal question={question} />}

                  <EditQuestionModal question={question} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
