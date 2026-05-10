import type { CollectionConfig } from 'payload/types'

export const Labels: CollectionConfig = {
  slug: 'labels',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'term', type: 'text' },
  ],
}

