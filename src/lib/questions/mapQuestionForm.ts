import type { QuestionDetail, QuestionFormData } from './types'

export function mapQuestionForm(question: QuestionDetail): QuestionFormData {
  return {
    exam: question.examId,

    questionNumber: question.questionNumber,

    questionType: question.questionType,

    questionText: question.questionText ?? '',

    options: question.options.map((o) => ({
      text: o.text ?? '',
    })),

    answer: question.answer ?? '',

    explanation: question.explanation ?? '',
  }
}
