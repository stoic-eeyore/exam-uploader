import { CollectionConfig } from 'payload'

export const GeminiMappings: CollectionConfig = {
  slug: 'gemini-mappings',
  admin: {
    useAsTitle: 'driveUrl',
    hidden: false, // Set to true if you don't want this cluttering your admin sidebar
  },
  fields: [
    {
      name: 'driveUrl',
      type: 'text',
      required: true,
      unique: true, // Speeds up Postgres lookups significantly
    },
    {
      name: 'driveLastUpdated',
      type: 'date',
      required: false,
    },
    {
      name: 'geminiFileName',
      type: 'text',
      required: true,
    },
    {
      name: 'geminiFileUri',
      type: 'text',
      required: true,
    },
    {
      name: 'geminiExpiresAt',
      type: 'date',
      required: true,
    },
  ],
}
