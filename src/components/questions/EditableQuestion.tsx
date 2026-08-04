export interface EditableQuestion {
  id: number

  questionText: string | null

  questionType: 'mcq' | 'essay'

  options: {
    text: string | null
  }[]

  images: {
    url: string
    placement: 'auto' | 'right'
    width: number | null
  }[]
}
