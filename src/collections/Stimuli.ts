import { CollectionConfig } from 'payload'

export const Stimuli: CollectionConfig = {
  slug: 'stimuli',
  fields: [
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
    },
    {
      name: 'stimulusNumber',
      type: 'number',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'placement',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Right', value: 'right' },
            { label: 'Top', value: 'top' },
            { label: 'Inline', value: 'inline' },
          ],
        },
        {
          name: 'width',
          type: 'number',
        },
        {
          name: 'alt',
          type: 'text',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
      ],
    },
  ],
}
