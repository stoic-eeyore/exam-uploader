import type { CollectionConfig } from 'payload'

export const Labels: CollectionConfig = {
  slug: 'labels',
  access: {
    read: () => true, // Publicly readable
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'term', type: 'text' },
  ],
}
