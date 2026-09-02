interface ImageData {
  url: string
  alt?: string | null
}

interface StimulusData {
  stimulusNumber?: number | null
  content?: string | null
  images?: ImageData[] | null
}

interface QuestionForClipboard {
  questionNumber?: number | null
  questionText?: string | null
  questionType?: 'mcq' | 'essay' | null
  options?:
    | {
        text?: string | null
      }[]
    | null
  images?: ImageData[] | null
  stimulus?: StimulusData | number | string | null
}

function formatImages(images?: ImageData[] | null) {
  if (!images?.length) return ''

  return images
    .map((image) => {
      const alt = image.alt ? ` (${image.alt})` : ''

      return `- ${image.url}${alt}`
    })
    .join('\n')
}

export function formatQuestionForClipboard(question: QuestionForClipboard) {
  const sections: string[] = []

  sections.push(`Question${question.questionNumber ? ` ${question.questionNumber}` : ''}`)

  // Stimulus
  if (question.stimulus && typeof question.stimulus === 'object') {
    const stimulus = question.stimulus

    const stimulusParts: string[] = []

    if (stimulus.content) {
      stimulusParts.push(stimulus.content)
    }

    const stimulusImages = formatImages(stimulus.images)

    if (stimulusImages) {
      stimulusParts.push(`Images:\n${stimulusImages}`)
    }

    if (stimulusParts.length > 0) {
      sections.push(`[Stimulus]\n${stimulusParts.join('\n\n')}`)
    }
  }

  // Question
  const questionParts: string[] = []

  if (question.questionText) {
    questionParts.push(question.questionText)
  }

  const questionImages = formatImages(question.images)

  if (questionImages) {
    questionParts.push(`Images:\n${questionImages}`)
  }

  if (questionParts.length > 0) {
    sections.push(`[Question]\n${questionParts.join('\n\n')}`)
  }

  // Options
  if (question.questionType === 'mcq' && question.options?.length) {
    const options = question.options
      .map((option, index) => {
        const letter = String.fromCharCode(65 + index)

        return `${letter}. ${option.text ?? ''}`
      })
      .join('\n')

    sections.push(`[Options]\n${options}`)
  }

  return sections.join('\n\n')
}
