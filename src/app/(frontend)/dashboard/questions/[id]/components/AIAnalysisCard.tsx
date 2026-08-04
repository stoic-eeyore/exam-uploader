import type { QuestionDetail } from '@/lib/questions/types'

interface Props {
  question: QuestionDetail
}

export function AIAnalysisCard({ question }: Props) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold">AI Analysis</h2>

      <dl className="grid grid-cols-2 gap-6">
        <div>
          <dt className="text-sm text-muted-foreground">AI Reviewed</dt>

          <dd>{question.reviewedByAI ? 'Yes' : 'No'}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Extraction Confidence</dt>

          <dd>{question.extractionConfidence ?? '—'}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Cognitive Level</dt>

          <dd>{question.cognitiveLevel ?? '—'}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Status</dt>

          <dd>{question.status}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <h3 className="mb-3 font-medium">Quality Issues</h3>

        {question.qualityIssues.length === 0 ? (
          <p className="text-muted-foreground">No issues detected.</p>
        ) : (
          <div className="space-y-2">
            {question.qualityIssues.map((issue, index) => (
              <div key={index} className="rounded border p-3">
                <div className="font-medium">{issue.issue}</div>

                <div className="text-sm capitalize text-muted-foreground">{issue.severity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
