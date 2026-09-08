import { Brain, CheckCircle2, ChevronDown, Lightbulb, Target, TrendingUp } from 'lucide-react'

type Rating = 'weak' | 'adequate' | 'strong'

interface Dimension {
  rating?: Rating | null
  explanation?: string | null
}

export interface ExamReviewData {
  summary?: string | null
  strengths?: string[]
  limitations?: string[]
  assessmentDimensions?: {
    cognitiveRange?: Dimension
    depthOfUnderstanding?: Dimension
    applicationAndTransfer?: Dimension
    reasoningAndProblemSolving?: Dimension
    authenticity?: Dimension
    overallAssessmentQuality?: Dimension
  }
  recommendations?: string[]
}

interface ExamReviewProps {
  review?: ExamReviewData | null
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
      {labels[rating]}
    </span>
  )
}

function DimensionRow({ label, dimension }: { label: string; dimension?: Dimension }) {
  if (!dimension) return null

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>

        {dimension.explanation && (
          <p className="mt-1 text-sm leading-5 text-gray-600">{dimension.explanation}</p>
        )}
      </div>

      <RatingBadge rating={dimension.rating} />
    </div>
  )
}

export default function ExamReview({ review }: ExamReviewProps) {
  if (!review) return null

  const dimensions = review.assessmentDimensions

  const overallRating = dimensions?.overallAssessmentQuality?.rating

  return (
    <details className="group mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Brain size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Assessment Quality Review</h2>

              <RatingBadge rating={overallRating} />
            </div>

            <p className="mt-0.5 text-sm text-gray-500">
              AI assessment of the exam&apos;s ability to measure student capability
            </p>
          </div>
        </div>

        <ChevronDown
          size={20}
          className="shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-gray-100 px-5 py-5">
        {review.summary && (
          <div className="mb-6">
            <p className="text-sm leading-6 text-gray-700">{review.summary}</p>
          </div>
        )}

        {(review.strengths?.length || review.limitations?.length) && (
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
        )}

        {dimensions && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Assessment Dimensions</h3>
            </div>

            <div className="rounded-lg border border-gray-200 px-4">
              <DimensionRow label="Cognitive Range" dimension={dimensions.cognitiveRange} />

              <DimensionRow
                label="Depth of Understanding"
                dimension={dimensions.depthOfUnderstanding}
              />

              <DimensionRow
                label="Application & Transfer"
                dimension={dimensions.applicationAndTransfer}
              />

              <DimensionRow
                label="Reasoning & Problem Solving"
                dimension={dimensions.reasoningAndProblemSolving}
              />

              <DimensionRow label="Authenticity" dimension={dimensions.authenticity} />

              <DimensionRow
                label="Overall Assessment Quality"
                dimension={dimensions.overallAssessmentQuality}
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

            <ul className="space-y-2">
              {review.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm leading-5 text-gray-600">
                  • {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  )
}
