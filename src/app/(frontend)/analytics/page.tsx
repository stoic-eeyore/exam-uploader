'use client'

import { useEffect, useMemo, useState } from 'react'

import { BarChart3, BookOpen, Brain, CheckCircle2, FileText, Loader2, Target } from 'lucide-react'

type Option = {
  id: string
  name: string
}

type ExamOption = Option & {
  year?: string | null
  label?: string | null
  semester?: string | null
}

type Percentages = {
  lots: number
  mots: number
  hots: number
}

type BreakdownItem = {
  id: string
  name: string
  totalQuestions: number
  lots: number
  mots: number
  hots: number
  percentages: Percentages
  year?: string | null
  label?: string | null
  semester?: string | null
}

type AnalyticsData = {
  filters: {
    years: string[]
    grades: Option[]
    subjects: Option[]
    exams: ExamOption[]
  }

  examCount: number
  totalQuestions: number
  classifiedQuestions: number
  unclassifiedQuestions: number

  lots: number
  mots: number
  hots: number

  percentages: Percentages

  bySubject: BreakdownItem[]
  byGrade: BreakdownItem[]
  byExam: BreakdownItem[]
}

function formatPercentage(value: number) {
  return `${Math.round(value)}%`
}

function CognitiveBar({
  percentages,
  height = 'h-8',
}: {
  percentages: Percentages
  height?: string
}) {
  const total = percentages.lots + percentages.mots + percentages.hots

  if (total === 0) {
    return (
      <div
        className={`${height} flex items-center justify-center rounded-md bg-muted text-xs text-muted-foreground`}
      >
        No classified questions
      </div>
    )
  }

  return (
    <div className={`${height} flex w-full overflow-hidden rounded-md`}>
      {percentages.lots > 0 && (
        <div
          className="flex items-center justify-center bg-slate-300 text-xs font-medium text-slate-800"
          style={{
            width: `${percentages.lots}%`,
          }}
        >
          {percentages.lots >= 10 && formatPercentage(percentages.lots)}
        </div>
      )}

      {percentages.mots > 0 && (
        <div
          className="flex items-center justify-center bg-slate-500 text-xs font-medium text-white"
          style={{
            width: `${percentages.mots}%`,
          }}
        >
          {percentages.mots >= 10 && formatPercentage(percentages.mots)}
        </div>
      )}

      {percentages.hots > 0 && (
        <div
          className="flex items-center justify-center bg-slate-800 text-xs font-medium text-white"
          style={{
            width: `${percentages.hots}%`,
          }}
        >
          {percentages.hots >= 10 && formatPercentage(percentages.hots)}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>

          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

function BreakdownTable({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: BreakdownItem[]
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>

        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No data available.
        </div>
      ) : (
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>

                  <p className="text-xs text-muted-foreground">
                    {item.totalQuestions} classified questions
                  </p>
                </div>

                <div className="shrink-0 text-xs text-muted-foreground">
                  HOTS {formatPercentage(item.percentages.hots)}
                </div>
              </div>

              <CognitiveBar percentages={item.percentages} />

              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>LOTS {formatPercentage(item.percentages.lots)}</span>

                <span>MOTS {formatPercentage(item.percentages.mots)}</span>

                <span>HOTS {formatPercentage(item.percentages.hots)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [year, setYear] = useState('2026/2027')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [exam, setExam] = useState('')

  const [data, setData] = useState<AnalyticsData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ------------------------------------------------------------
  // Load analytics
  // ------------------------------------------------------------

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()

        if (year) {
          params.set('year', year)
        }

        if (grade) {
          params.set('grade', grade)
        }

        if (subject) {
          params.set('subject', subject)
        }

        if (exam) {
          params.set('exam', exam)
        }

        const response = await fetch(`/api/analytics/cognitive?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to load cognitive analytics')
        }

        const result: AnalyticsData = await response.json()

        // If the selected exam is no longer valid after
        // changing another filter, clear it.
        if (exam && !result.filters.exams.some((item) => item.id === exam)) {
          setExam('')
        }

        setData(result)
      } catch (err) {
        console.error(err)

        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [year, grade, subject, exam])

  // ------------------------------------------------------------
  // Selected filter labels
  // ------------------------------------------------------------

  const selectedGrade = useMemo(
    () => data?.filters.grades.find((item) => item.id === grade),
    [data, grade],
  )

  const selectedSubject = useMemo(
    () => data?.filters.subjects.find((item) => item.id === subject),
    [data, subject],
  )

  const selectedExam = useMemo(
    () => data?.filters.exams.find((item) => item.id === exam),
    [data, exam],
  )

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header */}

      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

            <p className="text-sm text-muted-foreground">
              Explore the cognitive range of your assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />

          <h2 className="font-medium">Analytics scope</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Academic year */}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Academic year</label>

            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              disabled={!data}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              {data?.filters.years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Grade</label>

            <select
              value={grade}
              disabled={!data}
              onChange={(event) => setGrade(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">All grades</option>

              {data?.filters.grades.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Subject</label>

            <select
              value={subject}
              disabled={!data}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">All subjects</option>

              {data?.filters.subjects.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam */}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Exam</label>

            <select
              value={exam}
              disabled={!data || data.filters.exams.length === 0}
              onChange={(event) => setExam(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">All exams</option>

              {data?.filters.exams.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected filters */}

        {(selectedGrade || selectedSubject || selectedExam) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Showing:</span>

            {selectedGrade && (
              <span className="rounded-full bg-muted px-2.5 py-1">{selectedGrade.name}</span>
            )}

            {selectedSubject && (
              <span className="rounded-full bg-muted px-2.5 py-1">{selectedSubject.name}</span>
            )}

            {selectedExam && (
              <span className="rounded-full bg-muted px-2.5 py-1">{selectedExam.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}

      {loading && !data ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading analytics...
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Exams"
              value={data.examCount}
              description="Matching the current filters"
              icon={FileText}
            />

            <SummaryCard
              title="Questions"
              value={data.totalQuestions}
              description={`${data.classifiedQuestions} classified`}
              icon={BookOpen}
            />

            <SummaryCard
              title="Classified"
              value={
                data.totalQuestions > 0
                  ? formatPercentage((data.classifiedQuestions / data.totalQuestions) * 100)
                  : '0%'
              }
              description={`${data.unclassifiedQuestions} unclassified`}
              icon={CheckCircle2}
            />

            <SummaryCard
              title="HOTS"
              value={formatPercentage(data.percentages.hots)}
              description={`${data.hots} questions`}
              icon={Brain}
            />
          </div>

          {/* Cognitive range */}

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Cognitive range</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Distribution of classified questions across lower-, middle-, and higher-order
                thinking.
              </p>
            </div>

            <CognitiveBar percentages={data.percentages} height="h-12" />

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">LOTS</p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatPercentage(data.percentages.lots)}
                </p>

                <p className="text-xs text-muted-foreground">{data.lots} questions</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">MOTS</p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatPercentage(data.percentages.mots)}
                </p>

                <p className="text-xs text-muted-foreground">{data.mots} questions</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">HOTS</p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatPercentage(data.percentages.hots)}
                </p>

                <p className="text-xs text-muted-foreground">{data.hots} questions</p>
              </div>
            </div>

            {data.unclassifiedQuestions > 0 && (
              <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Cognitive percentages are calculated from {data.classifiedQuestions} classified
                questions. {data.unclassifiedQuestions} questions have not yet been classified.
              </div>
            )}
          </div>

          {/* By subject */}

          <BreakdownTable
            title="By subject"
            description="Compare cognitive range across subjects in the selected scope."
            items={data.bySubject}
          />

          {/* By grade */}

          <BreakdownTable
            title="By grade"
            description="Compare cognitive range across grade levels."
            items={data.byGrade}
          />

          {/* By exam */}

          <BreakdownTable
            title="By exam"
            description="See the cognitive range of individual exams."
            items={data.byExam}
          />
        </>
      ) : null}
    </div>
  )
}
