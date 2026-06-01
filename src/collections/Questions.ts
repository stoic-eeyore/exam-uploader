import { CollectionConfig } from 'payload'

export const Questions: CollectionConfig = {
  slug: 'questions',

  fields: [
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
    },

    {
      name: 'questionNumber',
      type: 'number',
      required: true,
    },

    {
      name: 'questionType',
      type: 'select',
      options: [
        {
          label: 'Multiple Choice',
          value: 'mcq',
        },
        {
          label: 'Essay',
          value: 'essay',
        },
      ],
    },

    {
      name: 'questionText',
      type: 'textarea',
    },

    {
      name: 'options',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'textarea',
        },
      ],
    },

    {
      name: 'answer',
      type: 'textarea',
    },

    {
      name: 'explanation',
      type: 'textarea',
    },

    {
      name: 'extractionConfidence',
      type: 'number',
      min: 0,
      max: 100,
    },

    {
      name: 'aiRawResponse',
      type: 'textarea',
    },

    {
      name: 'suggestedQuestionText',
      type: 'textarea',
    },

    {
      name: 'suggestedQuestionType',
      type: 'select',
      options: [
        {
          label: 'MCQ',
          value: 'mcq',
        },
        {
          label: 'Essay',
          value: 'essay',
        },
      ],
    },

    {
      name: 'suggestedOptions',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'textarea',
        },
      ],
    },

    {
      name: 'suggestedInstructions',
      type: 'textarea',
    },

    {
      name: 'editedByHuman',
      type: 'checkbox',
      defaultValue: false,
    },

    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Verified',
          value: 'verified',
        },
      ],
    },
  ],
}
