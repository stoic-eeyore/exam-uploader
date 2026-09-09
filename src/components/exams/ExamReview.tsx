'use client'

import { useState } from 'react'

import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  MoreHorizontal,
  Target,
  TrendingUp,
} from 'lucide-react'

import EditExamReviewJson from './EditExamReviewJson'

type Rating = 'weak' | 'adequate' | 'strong'

type CognitiveLevel = 'lots' | 'mots' | 'hots'

interface Dimension {
  rating?: Rating | null
  explanation?: string | null
}

export interface QuestionReview {
  questionNumber: number
  questionType: 'mcq' | 'essay'
  cognitiveLevel: CognitiveLevel
  correctnessIssues?: {
    issue: string
    severity: 'high'
    explanation: string
  }[]
}

export interface ExamReviewData {
  summary?: string | null
  strengths?: string[]
  limitations?: string[]
  assessmentDimensions?: {
    cognitiveRange?: Dimension
    conceptualUnderstanding?: Dimension
    applicationAndReasoning?: Dimension
    authenticityAndContext?: Dimension
    clarityAndAccessibility?: Dimension
  }
  recommendations?: {
    priority: 'high' | 'medium' | 'low'
    type: 'modify_question' | 'add_question' | 'exam_design'
    questionNumber?: number
    recommendation: string
    reason: string
    example?: {
      questionText: string
      questionType?: 'mcq' | 'essay'
      options?: string[]
      answer?: string
      explanation?: string
    }
  }[]
}

interface ExamReviewProps {
  examId: string
  review?: ExamReviewData | null
  questionReviews?: QuestionReview[]
}

function RatingBadge({ rating }: { rating?: Rating | null }) {
  if (!rating) return null

  const labels = {
    weak: 'Weak',
    adequate: 'Adequate',
    strong: 'Strong',
  }

  const classes = {
    weak: 'bg-red-50 text-red-700 border-red-200',
    adequate: 'bg-amber-50 text-amber-700 border-amber-200',
    strong: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes[rating]}`}
    >
      {labels[rating]}{' '}
    </span>
  )
}

function DimensionRow({ label, dimension }: { label: string; dimension?: Dimension }) {
  if (!dimension) return null

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      {' '}
      <div>
        {' '}
        <div className="text-sm font-medium text-gray-900">{label}</div>
        ```
        {dimension.explanation && (
          <p className="mt-1 text-sm leading-5 text-gray-600">{dimension.explanation}</p>
        )}
      </div>
      <RatingBadge rating={dimension.rating} />
    </div>
  )
}

function CognitiveProfile({ questionReviews }: { questionReviews: QuestionReview[] }) {
  const cognitiveCounts = {
    lots: questionReviews.filter((q) => q.cognitiveLevel === 'lots').length,
    mots: questionReviews.filter((q) => q.cognitiveLevel === 'mots').length,
    hots: questionReviews.filter((q) => q.cognitiveLevel === 'hots').length,
  }

  const total = cognitiveCounts.lots + cognitiveCounts.mots + cognitiveCounts.hots

  if (total === 0) return null

  const percentages = {
    lots: (cognitiveCounts.lots / total) * 100,
    mots: (cognitiveCounts.mots / total) * 100,
    hots: (cognitiveCounts.hots / total) * 100,
  }

  return (
    <div className="mb-6">
      {' '}
      <div className="mb-3 flex items-center gap-2">
        {' '}
        <Brain size={18} className="text-indigo-600" />{' '}
        <h3 className="text-sm font-semibold text-gray-900">Cognitive Profile </h3>{' '}
      </div>
      <div className="rounded-lg border border-gray-200 px-4 py-4">
        <div className="mb-4 text-sm text-gray-500">Cognitive demand across {total} questions</div>

        <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
          {percentages.lots > 0 && (
            <div
              className="bg-gray-400"
              style={{ width: `${percentages.lots}%` }}
              title={`LOTS: ${cognitiveCounts.lots}`}
            />
          )}

          {percentages.mots > 0 && (
            <div
              className="bg-indigo-400"
              style={{ width: `${percentages.mots}%` }}
              title={`MOTS: ${cognitiveCounts.mots}`}
            />
          )}

          {percentages.hots > 0 && (
            <div
              className="bg-indigo-700"
              style={{ width: `${percentages.hots}%` }}
              title={`HOTS: ${cognitiveCounts.hots}`}
            />
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-gray-900">LOTS</span>
            </div>

            <div className="mt-0.5 pl-4 text-xs text-gray-500">
              {cognitiveCounts.lots} questions · {Math.round(percentages.lots)}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
              <span className="text-sm font-medium text-gray-900">MOTS</span>
            </div>

            <div className="mt-0.5 pl-4 text-xs text-gray-500">
              {cognitiveCounts.mots} questions · {Math.round(percentages.mots)}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-700" />
              <span className="text-sm font-medium text-gray-900">HOTS</span>
            </div>

            <div className="mt-0.5 pl-4 text-xs text-gray-500">
              {cognitiveCounts.hots} questions · {Math.round(percentages.hots)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: NonNullable<ExamReviewData['recommendations']>[number]
}) {
  const priorityClasses = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-gray-50 text-gray-600 border-gray-200',
  }

  const typeLabels = {
    modify_question: 'Modify question',
    add_question: 'Add question',
    exam_design: 'Exam design',
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      {' '}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClasses[recommendation.priority]}`}
        >
          {recommendation.priority}{' '}
        </span>

        <span className="text-xs font-medium text-gray-500">{typeLabels[recommendation.type]}</span>

        {recommendation.questionNumber !== undefined && (
          <span className="text-xs text-gray-500">Question {recommendation.questionNumber}</span>
        )}
      </div>
      <p className="text-sm font-medium leading-5 text-gray-900">{recommendation.recommendation}</p>
      {recommendation.reason && (
        <p className="mt-1.5 text-sm leading-5 text-gray-600">{recommendation.reason}</p>
      )}
      {recommendation.example && (
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Example
          </div>

          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
            {recommendation.example.questionText}
          </p>

          {recommendation.example.options && recommendation.example.options.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {recommendation.example.options.map((option, index) => (
                <div key={index} className="text-sm leading-5 text-gray-700">
                  {option}
                </div>
              ))}
            </div>
          )}

          {recommendation.example.answer && (
            <div className="mt-3 text-sm">
              <span className="font-medium text-gray-900">Answer: </span>
              <span className="text-gray-700">{recommendation.example.answer}</span>
            </div>
          )}

          {recommendation.example.explanation && (
            <div className="mt-2 text-sm leading-5 text-gray-600">
              {recommendation.example.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExamReview({ examId, review, questionReviews = [] }: ExamReviewProps) {
  const [showEditReview, setShowEditReview] = useState(false)

  if (!review) return null

  const dimensions = review.assessmentDimensions

  return (
    <>
      {' '}
      <details className="group mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        {' '}
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          {' '}
          <div className="flex min-w-0 items-center gap-3">
            {' '}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              {' '}
              <Brain size={20} />{' '}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">Assessment Quality Review</h2>

              <p className="mt-0.5 text-sm text-gray-500">
                AI assessment of the exam's ability to measure student capability
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setShowEditReview(true)
              }}
              className="rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 focus:opacity-100"
              title="Edit review JSON"
            >
              <MoreHorizontal size={18} />
            </button>

            <ChevronDown
              size={20}
              className="text-gray-400 transition-transform duration-200 group-open:rotate-180"
            />
          </div>
        </summary>
        <div className="border-t border-gray-100 px-5 py-5">
          {review.summary && (
            <div className="mb-6">
              <p className="text-sm leading-6 text-gray-700">{review.summary}</p>
            </div>
          )}

          <CognitiveProfile questionReviews={questionReviews} />

          {review.strengths?.length || review.limitations?.length ? (
            <div className="mb-6 grid gap-5 md:grid-cols-2">
              {review.strengths && review.strengths.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
                  </div>

                  <ul className="space-y-2">
                    {review.strengths.map((strength, index) => (
                      <li key={index} className="text-sm leading-5 text-gray-600">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {review.limitations && review.limitations.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Target size={18} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Limitations</h3>
                  </div>

                  <ul className="space-y-2">
                    {review.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm leading-5 text-gray-600">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {dimensions && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Assessment Dimensions</h3>
              </div>

              <div className="rounded-lg border border-gray-200 px-4">
                <DimensionRow label="Cognitive Range" dimension={dimensions.cognitiveRange} />

                <DimensionRow
                  label="Conceptual Understanding"
                  dimension={dimensions.conceptualUnderstanding}
                />

                <DimensionRow
                  label="Application & Reasoning"
                  dimension={dimensions.applicationAndReasoning}
                />

                <DimensionRow
                  label="Authenticity & Context"
                  dimension={dimensions.authenticityAndContext}
                />

                <DimensionRow
                  label="Clarity & Accessibility"
                  dimension={dimensions.clarityAndAccessibility}
                />
              </div>
            </div>
          )}

          {review.recommendations && review.recommendations.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Recommendations</h3>
              </div>

              <div className="space-y-3">
                {review.recommendations.map((recommendation, index) => (
                  <RecommendationCard key={index} recommendation={recommendation} />
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
      {showEditReview && (
        <EditExamReviewJson
          examId={examId}
          review={review}
          onClose={() => setShowEditReview(false)}
        />
      )}
    </>
  )
}
