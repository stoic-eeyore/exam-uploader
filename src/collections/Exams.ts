import type { CollectionConfig } from 'payload'
import path from 'path'
import fs from 'fs'
import { uploadToDrive } from '../lib/googleDrive'

const yearOptions = []
for (let year = 2025; year >= 2015; year--) {
  const label = `${year}/${year + 1}`
  yearOptions.push({
    label: label, // What the editor sees
    value: label, // What is stored in the database
  })
}

export const Exams: CollectionConfig = {
  slug: 'exams',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'grade', 'subject', 'label', 'uploadedAt'],
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
      admin: {
        placeholder: 'Optional (auto-generated if left blank)',
      },
    },

    {
      type: 'row',
      fields: [
        {
          name: 'grade',
          type: 'relationship',
          relationTo: 'grades',
          required: true,
        },
        {
          name: 'subject',
          type: 'relationship',
          relationTo: 'subjects',
          required: true,
        },
      ],
    },

    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          defaultValue: 'Sumatif 1',
        },
        {
          name: 'year',
          type: 'select',
          required: true,
          options: yearOptions,
          defaultValue: '2025/2026',
        },
      ],
    },

    {
      name: 'description',
      type: 'richText',
    },

    // ✅ Store Google Drive URL after upload
    {
      name: 'driveUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'driveFileId',
      type: 'text',
      // required: true,
      defaultValue: '',
    },

    {
      name: 'filename',
      type: 'text',
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
      name: 'aiAnalysis',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'aiRawResponse',
      type: 'textarea',
    },

    {
      name: 'fileHash',
      type: 'text',
    },

    {
      name: 'processingStatus',
      type: 'select',
      defaultValue: 'uploaded',
      options: [
        { label: 'Uploaded', value: 'uploaded' },
        { label: 'Extracting', value: 'extracting' },
        { label: 'Review', value: 'review' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },

    {
      name: 'processingError',
      type: 'textarea',
    },

    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'uploadedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // ✅ Auto-set metadata
        if (req.user) {
          data.uploadedBy = req.user.id
        }
        data.uploadedAt = new Date()

        // ✅ Auto-generate title if missing
        if (!data.title && data.grade && data.subject && data.label) {
          const [gradeDoc, subjectDoc] = await Promise.all([
            req.payload.findByID({
              collection: 'grades',
              id: data.grade,
            }),
            req.payload.findByID({
              collection: 'subjects',
              id: data.subject,
            }),
          ])

          const gradeName = gradeDoc?.code || 'XX'
          const subjectName = subjectDoc?.code || 'XXX'

          data.title = `${gradeName}-${subjectName}-(${data.label})`
        }

        return data
      },
    ],

    //    afterChange: [
    //      async ({ doc, req, context }) => {
    //        console.log("in after change")
    //
    //        const getFieldName = async (collection, value) => {
    //          if (!value) return null;
    //
    //          // If it's already an object, just return the name field
    //          if (typeof value === 'object') {
    //            return value.name;
    //          }
    //
    //          // If it's just an ID, fetch the document
    //          const fetchedDoc = await req.payload.findByID({
    //            collection,
    //            id: value,
    //          });
    //
    //          return fetchedDoc?.name;
    //        };
    //
    //
    //        try {
    //          // STOP if already updated
    //          console.dir(doc)
    //          console.log("savingDriveUrl " + context)
    //          if (context?.savingDriveUrl) return
    //          //if (doc.driveUrl) return
    //
    //          // ✅ File info comes from Payload automatically
    //          if (!doc.filename) return
    //
    //          const filePath = path.resolve(`./exam-files/${doc.filename}`)
    //
    //          console.log("uploading to GDrive")
    //          //const year = typeof doc.year === 'object' ? doc.year.name : doc.year
    //          //const subject = typeof doc.subject === 'object' ? doc.subject.name : doc.subject
    //          //const grade = typeof doc.grade === 'object' ? doc.grade.name : doc.grade
    //
    //          const [grade, subject] = await Promise.all([
    //            getFieldName('grades', doc.grade),
    //            getFieldName('subjects', doc.subject),
    //          ]);
    //          const year = doc.year
    //
    //          console.log("here: " + year + " " + subject + " " + grade)
    //          // 🚀 Upload to Google Drive
    //          const driveUrl = await uploadToDrive({
    //            path: filePath,
    //            filename: doc.filename,
    //            mimeType: doc.mimeType,
    //            year,
    //            grade,
    //            subject,
    //          })
    //
    //          console.log("savingDriveUrl")
    //          // ✅ Save Drive URL back to document
    //          await req.payload.update({
    //            collection: 'exams',
    //            id: doc.id,
    //            data: {
    //              driveUrl,
    //            },
    //            req,
    //            // This prevents the loop:
    //            context: {
    //              savingDriveUrl: true,
    //            },
    //          })
    //
    //          console.log("removing local file")
    //          if (!fs.existsSync(filePath)) return
    //          // 🧹 Optional: delete local file after upload
    //          fs.unlinkSync(filePath)
    //
    //        } catch (err) {
    //          console.error('Drive upload failed:', err)
    //        }
    //      },
    //    ],
  },
}
