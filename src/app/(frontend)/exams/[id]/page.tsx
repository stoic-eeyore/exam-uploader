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
import VerifyButton from '@/components/questions/VerifyButton'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'

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

  const totalQuestions = questions.totalDocs
  const reviewedCount = questions.docs.filter((q: any) => q.status === 'verified').length
  const allReviewed = totalQuestions > 0 && reviewedCount === totalQuestions

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
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Questions</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{totalQuestions}</span>
            <span
              className={`text-sm font-medium inline-flex items-center gap-1 ${allReviewed ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              {allReviewed && <CheckCircle2 size={14} />}({reviewedCount} reviewed)
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${allReviewed ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{
                width: `${totalQuestions > 0 ? (reviewedCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-bold mt-1">{exam.processingStatus}</div>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Link</div>
          <div className="text-lg font-bold mt-1">
            {exam.driveUrl ? (
              <a
                href={exam.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
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
          const isVerified = question.status === 'verified'

          return (
            <div
              key={question.id}
              className={`rounded-lg border p-4 shadow-sm bg-white space-y-3 ${
                isVerified ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
              }`}
            >
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

                    {isVerified && (
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Verified
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
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center pl-[3.25rem] pt-2 border-t border-gray-100">
                <div className="inline-flex rounded-md border border-gray-200">
                  <VerifyButton question={question} />
                  <div className="w-px bg-gray-200" />
                  <EditQuestionModal question={question} />
                  <div className="w-px bg-gray-200" />
                  <ReextractButton questionId={question.id} />
                </div>
              </div>

              {question.suggestedQuestionText && <ReviewSuggestionModal question={question} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
