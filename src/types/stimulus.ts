export interface StimulusFormData {
  content: string
  images: {
    url: string
    placement: 'right' | 'auto' | 'top' | 'inline'
    width: number
    alt: string | null
  }[]
  stimulusNumber?: number | null
}
