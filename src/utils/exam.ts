export function generateExamFilename(
  grade: string,
  subject: string,
  year: string,
  label: string,
): string {
  const cleanYear = year.trim().replace(/[\s\/]+/g, '-')

  return `${grade}-${subject}-${cleanYear}-${label || 'Exam'}`
}
