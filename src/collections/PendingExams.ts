import { CollectionConfig } from 'payload'

export const PendingExams: CollectionConfig = {
  slug: 'pending-exams',

  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'uploadedAt', 'processed'],
  },

  access: {
    read: () => true, // Publicly readable
  },

  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
    },

    {
      name: 'mimeType',
      type: 'text',
    },

    {
      name: 'filesize',
      type: 'number',
    },

    {
      name: 'driveUrl',
      type: 'text',
      required: true,
    },

    {
      name: 'aiAnalysis',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'processed',
      type: 'checkbox',
      defaultValue: false,
    },

    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
    },

    {
      name: 'uploadedAt',
      type: 'date',
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user) {
          data.uploadedBy = req.user.id
        }

        data.uploadedAt = new Date()

        return data
      },
    ],
  },
}
