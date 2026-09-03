import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({
    config,
  })

  const stimulus = await payload.findByID({
    collection: 'stimuli',
    id,
  })

  const questions = await payload.find({
    collection: 'questions',
    where: {
      stimulus: {
        equals: id,
      },
    },
    sort: 'questionNumber',
    limit: 100,
  })

  return NextResponse.json({
    stimulus,
    questions: questions.docs,
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const payload = await getPayload({
    config,
  })

  const stimulus = await payload.findByID({
    collection: 'stimuli',
    id,
  })

  if (!stimulus) {
    return NextResponse.json({ error: 'Stimulus not found' }, { status: 404 })
  }

  const { startQuestion, endQuestion, content, images } = body

  // Update the stimulus itself
  await payload.update({
    collection: 'stimuli',
    id,
    data: {
      content,
      images,
    },
  })

  const examId = typeof stimulus.exam === 'object' ? stimulus.exam.id : stimulus.exam

  // Find currently assigned questions
  const currentQuestions = await payload.find({
    collection: 'questions',
    where: {
      stimulus: {
        equals: id,
      },
    },
    limit: 100,
  })

  // Find questions that should be assigned
  const newQuestions = await payload.find({
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
  })

  const newQuestionIds = new Set(newQuestions.docs.map((question) => question.id))

  const currentQuestionIds = new Set(currentQuestions.docs.map((question) => question.id))

  // Detach questions no longer in the range
  for (const question of currentQuestions.docs) {
    if (!newQuestionIds.has(question.id)) {
      await payload.update({
        collection: 'questions',
        id: question.id,
        data: {
          stimulus: null,
        },
      })
    }
  }

  // Attach newly included questions
  for (const question of newQuestions.docs) {
    if (!currentQuestionIds.has(question.id)) {
      await payload.update({
        collection: 'questions',
        id: question.id,
        data: {
          stimulus: stimulus.id,
        },
      })
    }
  }

  return NextResponse.json({
    success: true,
  })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload({
    config,
  })

  // Get the stimulus before deleting it so we know its exam
  const stimulus = await payload.findByID({
    collection: 'stimuli',
    id,
  })

  if (!stimulus) {
    return NextResponse.json({ error: 'Stimulus not found' }, { status: 404 })
  }

  const examId = typeof stimulus.exam === 'object' ? stimulus.exam.id : stimulus.exam

  // Find questions using this stimulus
  const questions = await payload.find({
    collection: 'questions',
    where: {
      stimulus: {
        equals: id,
      },
    },
    limit: 100,
  })

  // Detach the stimulus from those questions
  for (const question of questions.docs) {
    await payload.update({
      collection: 'questions',
      id: question.id,
      data: {
        stimulus: null,
      },
    })
  }

  // Now it's safe to delete the stimulus
  await payload.delete({
    collection: 'stimuli',
    id,
  })

  // Get remaining stimuli for this exam
  const remainingStimuli = await payload.find({
    collection: 'stimuli',
    where: {
      exam: {
        equals: examId,
      },
    },
    limit: 100,
  })

  // Get all questions for this exam
  const examQuestions = await payload.find({
    collection: 'questions',
    where: {
      exam: {
        equals: examId,
      },
    },
    limit: 100,
  })

  // mcq sorts before essay
  const typeRank = (type: string) => (type === 'mcq' ? 0 : type === 'essay' ? 1 : 2)

  type SortKey = [number, number] // [typeRank, questionNumber]

  const compareKeys = (a: SortKey, b: SortKey) => a[0] - b[0] || a[1] - b[1]

  // Compute the "earliest" question per stimulus, where "earliest" means
  // smallest (typeRank, questionNumber) tuple — mcq questions win over essay
  // regardless of number, and ties within a type break by questionNumber.
  const earliestKeyByStimulusId = new Map<number, SortKey>()

  for (const question of examQuestions.docs) {
    if (!question.stimulus) continue

    const stimulusId =
      typeof question.stimulus === 'object' ? question.stimulus.id : question.stimulus

    const questionNumber = question.questionNumber ?? 100
    const questionType = question.questionType ?? 'other'
    const key: SortKey = [typeRank(questionType), questionNumber]

    const existing = earliestKeyByStimulusId.get(stimulusId)

    if (existing === undefined || compareKeys(key, existing) < 0) {
      earliestKeyByStimulusId.set(stimulusId, key)
    }
  }

  // Sort stimuli by their earliest associated (type, questionNumber) key.
  // Stimuli with no questions (orphaned) go to the end.
  const sortedStimuli = [...remainingStimuli.docs].sort((a, b) => {
    const aKey = earliestKeyByStimulusId.get(a.id) ?? [Infinity, Infinity]
    const bKey = earliestKeyByStimulusId.get(b.id) ?? [Infinity, Infinity]
    return compareKeys(aKey, bKey)
  })

  // Renumber sequentially
  for (let index = 0; index < sortedStimuli.length; index++) {
    const stimulus = sortedStimuli[index]
    const newNumber = index + 1

    if (stimulus.stimulusNumber !== newNumber) {
      await payload.update({
        collection: 'stimuli',
        id: stimulus.id,
        data: {
          stimulusNumber: newNumber,
        },
      })
    }
  }

  return NextResponse.json({
    success: true,
  })
}
