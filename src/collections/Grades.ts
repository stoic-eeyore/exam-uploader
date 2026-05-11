import type { CollectionConfig } from 'payload'

export const Grades: CollectionConfig = {
  slug: 'grades',
  access: {
    read: () => true, // Publicly readable
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'code', type: 'text', required: true },
    { name: 'order', type: 'number' },
  ],
}
