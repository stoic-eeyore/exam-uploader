import type { CollectionConfig } from 'payload/types'

export const Grades: CollectionConfig = {
  slug: 'grades',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'code', type: 'text', required: true },
    { name: 'order', type: 'number' },
  ],
}

