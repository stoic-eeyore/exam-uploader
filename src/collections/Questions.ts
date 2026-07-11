import { CollectionConfig } from 'payload'

export const Questions: CollectionConfig = {
  slug: 'questions',

  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation !== 'update') return data

        const wasVerified = originalDoc?.status === 'verified'
        const isNowVerified = data.status === 'verified'
        const isNowDraft = data.status === 'draft'

        // Just got verified
        if (!wasVerified && isNowVerified) {
          data.verifiedBy = req.user?.id || null
          data.verifiedAt = new Date().toISOString()
        }

        // Just got un-verified
        if (wasVerified && isNowDraft) {
          data.verifiedBy = null
          data.verifiedAt = null
        }

        return data
      },
    ],
  },

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
      name: 'qualityIssues',
      type: 'array',
      fields: [
        {
          name: 'issue',
          type: 'text',
        },
        {
          name: 'severity',
          type: 'select',
          options: ['low', 'medium', 'high'],
        },
      ],
    },

    {
      name: 'cognitiveLevel',
      type: 'select',
      options: [
        {
          label: 'Recall',
          value: 'recall',
        },
        {
          label: 'Understanding',
          value: 'understanding',
        },
        {
          label: 'HOTS',
          value: 'hots',
        },
      ],
    },

    {
      name: 'reviewedByAI',
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

    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'verifiedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },

    {
      name: 'fixes',
      type: 'array',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
        },
        {
          name: 'fixedBy',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'fixedAt',
          type: 'date',
        },
      ],
    },
  ],
}
