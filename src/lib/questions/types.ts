import type { Question } from '@/payload-types'

export type CognitiveLevel = 'recall' | 'understanding' | 'hots'

export interface QuestionListItem {
  id: number

  questionNumber: number
  questionText: string
  questionType: 'mcq' | 'essay'

  examTitle: string
  examDriveUrl: string
  subjectName: string
  gradeName: string

  reviewedByAI: boolean
  status: 'draft' | 'verified' | 'pending'
  cognitiveLevel: CognitiveLevel | null

  updatedAt: string
}

export interface QuestionListResponse {
  questions: QuestionListItem[]

  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface QuestionDetail extends EditableQuestion {
  id: number

  grade: number | null
  subject: number | null

  questionNumber: number | null
  questionType: 'mcq' | 'essay'

  questionText: string | null

  options: {
    text: string | null
  }[]

  answer: string | null

  explanation: string | null

  images: {
    url: string
    placement: ImagePlacement
    width: number | null
    // alt?: string | null
  }[]

  stimulus: {
    id: number
    content: string | null
    images: {
      url: string
      placement: ImagePlacement
      width: number | null
      alt: string | null
    }[]
  } | null

  reviewedByAI: boolean

  extractionConfidence: number | null

  cognitiveLevel: 'recall' | 'understanding' | 'hots' | null

  qualityIssues: {
    issue: string
    severity: 'low' | 'medium' | 'high'
  }[]

  suggestedQuestionText: string | null

  suggestedQuestionType: 'mcq' | 'essay' | null

  suggestedOptions: {
    text: string | null
  }[]

  suggestedInstructions: string | null

  status: 'draft' | 'verified'

  fixes: {
    note: string
    fixedAt: string | null
  }[]

  examTitle: string | null
  examId: number | null
}

export type ImagePlacement = 'auto' | 'right' | 'top' | 'inline'

export interface QuestionFormData {
  grade: number | null
  subject: number | null

  questionType: 'mcq' | 'essay'

  questionText: string

  options: {
    text: string | null
  }[]

  images: {
    url: string
    placement: ImagePlacement
    width: number
    // alt: string | null
  }[]
}

import type { Grade, Subject } from '@/payload-types'

export type EditableQuestion = Pick<
  Question,
  'id' | 'grade' | 'subject' | 'questionType' | 'questionText' | 'options' | 'images'
>
