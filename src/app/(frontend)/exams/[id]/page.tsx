import config from '@payload-config'
import { getPayload } from 'payload'
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
import { ChevronLeft, CheckCircle2, Wrench } from 'lucide-react'
import QualityIssuesEditor from '@/components/questions/QualityIssuesEditor'
import FixesLog from '@/components/questions/FixesLog'
import ExamMetaDataEditor from '@/components/exams/ExamMetaDataEditor'
import StatusEditor from '@/components/exams/StatusEditor'

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
  const fixedCount = questions.docs.reduce((sum: number, q: any) => sum + (q.fixes?.length || 0), 0)
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

        {/* Exam Metadata Editor — client component with edit mode */}
        <ExamMetaDataEditor
          exam={{
            id: exam.id,
            title: exam.title ?? '',
            year: exam.year ?? '',
            label: exam.label ?? '',
            filename: exam.filename ?? '',
            processingStatus: exam.processingStatus ?? '',
            reviewedByAI: exam.reviewedByAI ?? false,
            grade: exam.grade,
            subject: exam.subject,
            driveFileId: exam.driveFileId,
          }}
        />
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
              {fixedCount > 0 && (
                <span className="text-sm font-medium text-amber-600 inline-flex items-center gap-1">
                  <Wrench size={14} />({fixedCount} fixed)
                </span>
              )}
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

        {/* NEW — editable status */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-500">Status</div>
            <StatusEditor
              examId={String(exam.id)}
              currentStatus={(exam.processingStatus as any) || 'uploaded'}
            />
          </div>

          {/* Visual indicator that stays in sync */}
          <div className="flex items-center gap-1.5 mt-1">
            {exam.processingStatus === 'completed' ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-lg font-bold text-emerald-600">Completed</span>
              </>
            ) : exam.processingStatus === 'consultation' ? (
              <>
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span className="text-lg font-bold text-violet-600">Pending Consultation</span>
              </>
            ) : exam.processingStatus === 'review' ? (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-lg font-bold text-blue-600">In Review</span>
              </>
            ) : exam.processingStatus === 'extracting' ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg font-bold text-amber-600">Extracting...</span>
              </>
            ) : exam.processingStatus === 'failed' ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-lg font-bold text-red-600">Failed</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-lg font-bold text-gray-600">Uploaded</span>
              </>
            )}
          </div>
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

                  <div className="mb-3">
                    <QualityIssuesEditor question={question} />
                  </div>

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

              <div className="pl-[3.25rem] pt-2">
                <FixesLog question={question} />
              </div>

              {question.suggestedQuestionText && <ReviewSuggestionModal question={question} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
