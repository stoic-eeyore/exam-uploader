'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  grades: {
    id: number
    name: string
  }[]

  subjects: {
    id: number
    name: string
  }[]

  selectedGrade?: number
  selectedSubject?: number
}

export default function QuestionFilters({
  grades,
  subjects,
  selectedGrade,
  selectedSubject,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/dashboard/questions?${params}`)
  }

  return (
    <div className="flex gap-4 mb-6">
      <select
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        value={selectedGrade ?? ''}
        onChange={(e) => updateFilter('grade', e.target.value)}
      >
        <option value="">All Grades</option>

        {grades.map((grade) => (
          <option key={grade.id} value={grade.id}>
            {grade.name}
          </option>
        ))}
      </select>

      <select
        value={selectedSubject ?? ''}
        onChange={(e) => updateFilter('subject', e.target.value)}
      >
        <option value="">All Subjects</option>

        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  )
}
