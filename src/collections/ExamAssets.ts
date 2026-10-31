import type { CollectionConfig } from 'payload'

export const ExamAssets: CollectionConfig = {
  slug: 'exam-assets',

  fields: [
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
      index: true,
    },
    {
      name: 'page',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'imageIndex',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
    {
      name: 'extractionVersion',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'cloudinaryPublicId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'cloudinaryAssetId',
      type: 'text',
      required: true,
    },
    {
      name: 'mimeType',
      type: 'text',
      required: true,
    },
  ],
}
