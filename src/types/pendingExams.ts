export type AIAnalysis = {
  label?: string
  year?: string
  gradeId?: number
  subjectId?: number
  semester?: string
  confidence?: number
}

export type ExamStatus = 'new' | 'verified' | 'processed' | 'archived' | 'failed'

export type Exam = {
  id: number
  filename: string
  status: ExamStatus
  processed: boolean
  filesize?: number
  uploadedAt?: string
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: AIAnalysis | null
}
