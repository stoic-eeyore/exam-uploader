export type ProcessingStatus = 'uploaded' | 'extracting' | 'review' | 'completed' | 'failed'

export type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: string | null
  year?: string
  createdAt?: string
  processingStatus?: ProcessingStatus
  grade?: { name: string }
  subject?: { name: string }
}

export type DashboardData = {
  totalExams: number
  recent: Exam[]
}

export type AnalysisResponse = {
  success: boolean
  aiAnalysis?: string
  error?: string
}

export const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; color: string; bg: string; dot?: string }
> = {
  uploaded:   { label: 'Uploaded',    color: 'text-[#6b7280]', bg: 'bg-[#f3f4f6]' },
  extracting: { label: 'Extracting',  color: 'text-[#b45309]', bg: 'bg-[#fef3c7]', dot: 'bg-[#f59e0b]' },
  review:     { label: 'Review',      color: 'text-[#1e40af]', bg: 'bg-[#dbeafe]', dot: 'bg-[#3b82f6]' },
  completed:  { label: 'Completed',   color: 'text-[#065f46]', bg: 'bg-[#d1fae5]', dot: 'bg-[#10b981]' },
  failed:     { label: 'Failed',      color: 'text-[#991b1b]', bg: 'bg-[#fee2e2]', dot: 'bg-[#ef4444]' },
}

export const ALL_STATUSES: ProcessingStatus[] = ['uploaded', 'extracting', 'review', 'completed', 'failed']

