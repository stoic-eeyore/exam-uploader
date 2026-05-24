'use client'

import { useEffect, useState } from 'react'

export type SelectOption = {
  id: number
  name: string
}

export function useExamOptions() {
  const [grades, setGrades] = useState<SelectOption[]>([])
  const [subjects, setSubjects] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOptions() {
      try {
        const [gradesRes, subjectsRes] = await Promise.all([
          fetch('/api/grades?limit=100'),
          fetch('/api/subjects?limit=100'),
        ])

        const gradesData = await gradesRes.json()
        const subjectsData = await subjectsRes.json()

        setGrades(gradesData.docs || [])
        setSubjects(subjectsData.docs || [])
      } catch (err) {
        console.error('Failed loading exam options', err)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [])

  return {
    grades,
    subjects,
    loading,
  }
}

