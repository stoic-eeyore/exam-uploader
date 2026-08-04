export type CognitiveLevel = 'recall' | 'understanding' | 'hots'

export interface QuestionListItem {
  id: number

  questionNumber: number
  questionText: string
  questionType: 'mcq' | 'essay'

  examTitle: string
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

export interface QuestionDetail {
  id: number

  questionNumber: number
  questionType: 'mcq' | 'essay'

  questionText: string | null

  options: {
    text: string | null
  }[]

  answer: string | null

  explanation: string | null

  images: {
    url: string
    placement: 'auto' | 'right' | 'top' | 'inline'
    width?: number | null
    alt?: string | null
  }[]

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

  examTitle: string
}
