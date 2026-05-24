export type AIAnalysis = {
  label?: string
  year?: string
  gradeId?: number
  subjectId?: number
  confidence?: number
}

export type Exam = {
  id: number
  filename: string
  processed: boolean
  filesize?: number
  uploadedAt?: string
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: AIAnalysis | null
}
