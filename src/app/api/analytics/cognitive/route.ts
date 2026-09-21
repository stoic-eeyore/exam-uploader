import config from '@payload-config'

import { getPayload } from 'payload'

import { NextRequest, NextResponse } from 'next/server'

type CognitiveLevel = 'lots' | 'mots' | 'hots'

type CognitiveCounts = {
  lots: number
  mots: number
  hots: number
}

type BreakdownItem = CognitiveCounts & {
  id: string
  name: string
  totalQuestions: number
  percentages: {
    lots: number
    mots: number
    hots: number
  }
}

function emptyCounts(): CognitiveCounts {
  return {
    lots: 0,
    mots: 0,
    hots: 0,
  }
}

function calculatePercentages(counts: CognitiveCounts) {
  const total = counts.lots + counts.mots + counts.hots

  return {
    lots: total > 0 ? (counts.lots / total) * 100 : 0,
    mots: total > 0 ? (counts.mots / total) * 100 : 0,
    hots: total > 0 ? (counts.hots / total) * 100 : 0,
  }
}

function createBreakdownItem(id: string, name: string, counts: CognitiveCounts): BreakdownItem {
  const totalQuestions = counts.lots + counts.mots + counts.hots

  return {
    id,
    name,
    totalQuestions,
    ...counts,
    percentages: calculatePercentages(counts),
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const year = searchParams.get('year')
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')
    const exam = searchParams.get('exam')

    // ------------------------------------------------------------
    // 1. Build exam filters
    // ------------------------------------------------------------

    const examWhere: Record<string, any> = {}

    if (year) {
      examWhere.year = {
        equals: year,
      }
    }

    if (subject) {
      examWhere.subject = {
        equals: subject,
      }
    }

    if (grade) {
      examWhere.grade = {
        equals: grade,
      }
    }

    if (exam) {
      examWhere.id = {
        equals: exam,
      }
    }

    // ------------------------------------------------------------
    // 2. Find matching exams
    // ------------------------------------------------------------

    const exams = await payload.find({
      collection: 'exams',
      where: examWhere,
      limit: 1000,
      depth: 1,
    })

    // ------------------------------------------------------------
    // 3. Build filter options from the exams
    //
    // These are returned by the same endpoint so the client
    // doesn't need to call Payload's protected REST endpoints.
    // ------------------------------------------------------------

    const yearSet = new Set<string>()

    const gradeMap = new Map<
      string,
      {
        id: string
        name: string
      }
    >()

    const subjectMap = new Map<
      string,
      {
        id: string
        name: string
      }
    >()

    for (const examDoc of exams.docs) {
      if (examDoc.year) {
        yearSet.add(String(examDoc.year))
      }

      const gradeDoc = typeof examDoc.grade === 'object' ? examDoc.grade : null

      const gradeId = gradeDoc?.id ?? (typeof examDoc.grade !== 'object' ? examDoc.grade : null)

      if (gradeId) {
        const gradeKey = String(gradeId)

        if (!gradeMap.has(gradeKey)) {
          gradeMap.set(gradeKey, {
            id: gradeKey,
            name: gradeDoc?.name || gradeDoc?.name || gradeKey,
          })
        }
      }

      const subjectDoc = typeof examDoc.subject === 'object' ? examDoc.subject : null

      const subjectId =
        subjectDoc?.id ?? (typeof examDoc.subject !== 'object' ? examDoc.subject : null)

      if (subjectId) {
        const subjectKey = String(subjectId)

        if (!subjectMap.has(subjectKey)) {
          subjectMap.set(subjectKey, {
            id: subjectKey,
            name: subjectDoc?.name || subjectDoc?.name || subjectKey,
          })
        }
      }
    }

    // ------------------------------------------------------------
    // 4. If there are no matching exams, return empty analytics
    // ------------------------------------------------------------

    if (exams.docs.length === 0) {
      return NextResponse.json({
        filters: {
          years: [],
          grades: [],
          subjects: [],
          exams: [],
        },

        examCount: 0,
        totalQuestions: 0,
        classifiedQuestions: 0,
        unclassifiedQuestions: 0,

        lots: 0,
        mots: 0,
        hots: 0,

        percentages: {
          lots: 0,
          mots: 0,
          hots: 0,
        },

        bySubject: [],
        byGrade: [],
        byExam: [],
      })
    }

    const examIds = exams.docs.map((exam) => exam.id)

    // ------------------------------------------------------------
    // 5. Get all questions belonging to these exams
    //
    // The Questions collection access rule already excludes
    // soft-deleted questions.
    // ------------------------------------------------------------

    const questions = await payload.find({
      collection: 'questions',
      where: {
        exam: {
          in: examIds,
        },
      },
      limit: 10000,
      depth: 1,
    })

    // ------------------------------------------------------------
    // 6. Overall cognitive counts
    // ------------------------------------------------------------

    const overall: CognitiveCounts = emptyCounts()

    let classifiedQuestions = 0

    // ------------------------------------------------------------
    // 7. Breakdown maps
    // ------------------------------------------------------------

    const subjectBreakdownMap = new Map<
      string,
      {
        id: string
        name: string
        counts: CognitiveCounts
      }
    >()

    const gradeBreakdownMap = new Map<
      string,
      {
        id: string
        name: string
        counts: CognitiveCounts
      }
    >()

    const examBreakdownMap = new Map<
      string,
      {
        id: string
        name: string
        year: string | null
        label: string | null
        semester: string | null
        counts: CognitiveCounts
      }
    >()

    // ------------------------------------------------------------
    // 8. Create exam lookup
    // ------------------------------------------------------------

    const examMapById = new Map(exams.docs.map((examDoc) => [String(examDoc.id), examDoc]))

    // ------------------------------------------------------------
    // 9. Process questions
    // ------------------------------------------------------------

    for (const question of questions.docs) {
      const level = question.cognitiveLevel as CognitiveLevel | null

      // Ignore unclassified questions.
      if (level !== 'lots' && level !== 'mots' && level !== 'hots') {
        continue
      }

      const examId = typeof question.exam === 'object' ? question.exam?.id : question.exam

      if (!examId) {
        continue
      }

      const examDoc = examMapById.get(String(examId))

      if (!examDoc) {
        continue
      }

      classifiedQuestions++

      overall[level]++

      // ----------------------------------------------------------
      // Exam breakdown
      // ----------------------------------------------------------

      const examKey = String(examDoc.id)

      if (!examBreakdownMap.has(examKey)) {
        examBreakdownMap.set(examKey, {
          id: examKey,
          name: examDoc.title || `Exam ${examKey}`,
          year: examDoc.year ? String(examDoc.year) : null,
          label: examDoc.label || null,
          semester: examDoc.semester || null,
          counts: emptyCounts(),
        })
      }

      examBreakdownMap.get(examKey)!.counts[level]++

      // ----------------------------------------------------------
      // Subject breakdown
      // ----------------------------------------------------------

      const subjectDoc = typeof examDoc.subject === 'object' ? examDoc.subject : null

      const subjectId =
        subjectDoc?.id ?? (typeof examDoc.subject !== 'object' ? examDoc.subject : null)

      if (subjectId) {
        const subjectKey = String(subjectId)

        if (!subjectBreakdownMap.has(subjectKey)) {
          subjectBreakdownMap.set(subjectKey, {
            id: subjectKey,
            name: subjectDoc?.name || subjectDoc?.name || subjectKey,
            counts: emptyCounts(),
          })
        }

        subjectBreakdownMap.get(subjectKey)!.counts[level]++
      }

      // ----------------------------------------------------------
      // Grade breakdown
      // ----------------------------------------------------------

      const gradeDoc = typeof examDoc.grade === 'object' ? examDoc.grade : null

      const gradeId = gradeDoc?.id ?? (typeof examDoc.grade !== 'object' ? examDoc.grade : null)

      if (gradeId) {
        const gradeKey = String(gradeId)

        if (!gradeBreakdownMap.has(gradeKey)) {
          gradeBreakdownMap.set(gradeKey, {
            id: gradeKey,
            name: gradeDoc?.name || gradeDoc?.name || gradeKey,
            counts: emptyCounts(),
          })
        }

        gradeBreakdownMap.get(gradeKey)!.counts[level]++
      }
    }

    // ------------------------------------------------------------
    // 10. Convert breakdown maps
    // ------------------------------------------------------------

    const bySubject = Array.from(subjectBreakdownMap.values())
      .map((item) => createBreakdownItem(item.id, item.name, item.counts))
      .sort((a, b) => b.totalQuestions - a.totalQuestions)

    const byGrade = Array.from(gradeBreakdownMap.values())
      .map((item) => createBreakdownItem(item.id, item.name, item.counts))
      .sort((a, b) => b.totalQuestions - a.totalQuestions)

    const byExam = Array.from(examBreakdownMap.values())
      .map((item) => ({
        ...createBreakdownItem(item.id, item.name, item.counts),
        year: item.year,
        label: item.label,
        semester: item.semester,
      }))
      .sort((a, b) => b.totalQuestions - a.totalQuestions)

    // ------------------------------------------------------------
    // 11. Filter options
    // ------------------------------------------------------------

    const filterYears = Array.from(yearSet).sort().reverse()

    const filterGrades = Array.from(gradeMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    const filterSubjects = Array.from(subjectMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    const filterExams = exams.docs
      .map((examDoc) => ({
        id: String(examDoc.id),
        name: examDoc.title || `Exam ${examDoc.id}`,
        year: examDoc.year ? String(examDoc.year) : null,
        label: examDoc.label || null,
        semester: examDoc.semester || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // ------------------------------------------------------------
    // 12. Return analytics
    // ------------------------------------------------------------

    const totalQuestions = questions.docs.length
    const unclassifiedQuestions = totalQuestions - classifiedQuestions

    return NextResponse.json({
      filters: {
        years: filterYears,
        grades: filterGrades,
        subjects: filterSubjects,
        exams: filterExams,
      },

      examCount: exams.totalDocs,

      totalQuestions,
      classifiedQuestions,
      unclassifiedQuestions,

      lots: overall.lots,
      mots: overall.mots,
      hots: overall.hots,

      percentages: calculatePercentages(overall),

      bySubject,
      byGrade,
      byExam,
    })
  } catch (error) {
    console.error('Cognitive range report error:', error)

    return NextResponse.json(
      {
        error: 'Failed to calculate cognitive range',
      },
      { status: 500 },
    )
  }
}
