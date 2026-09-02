'use server'

import config from '@payload-config'

import { getPayload } from 'payload'

import type { StimulusFormData } from '@/types/stimulus'

export async function createStimulus(
  questionId: number,
  startQuestion: number,
  endQuestion: number,
  data: StimulusFormData,
) {
  const payload = await getPayload({
    config,
  })

  // Get the question so we know which exam it belongs to
  const question = await payload.findByID({
    collection: 'questions',
    id: questionId,
  })

  if (!question.exam) {
    throw new Error('Question is not associated with an exam.')
  }

  const examId = typeof question.exam === 'number' ? question.exam : question.exam.id

  // Validate the range
  if (startQuestion > endQuestion) {
    throw new Error('Starting question cannot be greater than ending question.')
  }

  // Get all questions in the selected range
  const questionsResult = await payload.find({
    collection: 'questions',
    where: {
      and: [
        {
          exam: {
            equals: examId,
          },
        },
        {
          questionNumber: {
            greater_than_equal: startQuestion,
          },
        },
        {
          questionNumber: {
            less_than_equal: endQuestion,
          },
        },
      ],
    },
    limit: 100,
    sort: 'questionNumber',
  })

  const questions = questionsResult.docs

  // Make sure every question in the range exists
  const expectedCount = endQuestion - startQuestion + 1

  if (questions.length !== expectedCount) {
    throw new Error(`Could not find every question from ${startQuestion} to ${endQuestion}.`)
  }

  // Don't silently replace existing stimulus relationships
  const questionsWithStimulus = questions.filter((question) => question.stimulus)

  if (questionsWithStimulus.length > 0) {
    const numbers = questionsWithStimulus.map((question) => question.questionNumber).join(', ')

    throw new Error(
      `Question${questionsWithStimulus.length > 1 ? 's' : ''} ${numbers} already ${questionsWithStimulus.length > 1 ? 'have' : 'has'} a stimulus.`,
    )
  }

  // Find the latest stimulus number in this exam
  const existingStimuli = await payload.find({
    collection: 'stimuli',
    where: {
      exam: {
        equals: examId,
      },
    },
    sort: '-stimulusNumber',
    limit: 1,
  })

  const stimulusNumber =
    existingStimuli.docs.length > 0 ? existingStimuli.docs[0].stimulusNumber + 1 : 1

  // Create the stimulus
  const stimulus = await payload.create({
    collection: 'stimuli',
    data: {
      exam: examId,
      stimulusNumber,
      content: data.content,
      images: data.images,
      status: 'draft',
    },
  })

  // Attach the new stimulus to every question in the range
  for (const question of questions) {
    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        stimulus: stimulus.id,
      },
    })
  }

  return stimulus
}
