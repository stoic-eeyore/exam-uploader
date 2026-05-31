import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { listDriveFiles, convertDriveDocxToPdfFile } from '@/lib/googleDrive'

export async function POST() {
  console.log('Syncing pending exams from Google Drive...')
  try {
    const payload = await getPayloadClient()

    const folderId = process.env.GOOGLE_DRIVE_DROPBOX_FOLDER_ID!

    const files = await listDriveFiles(folderId)
    console.log(`Found ${files.length} files in Google Drive dropbox folder`)

    let imported = 0

    for (const file of files) {
      console.log(`Processing file: ${file.name} (${file.id})`)
      // Ignore temporary files
      if (file.name?.toLowerCase().startsWith('temp_')) {
        console.log(`Skipping temp file: ${file.name}`)
        continue
      }

      // Check if already imported
      const existing = await payload.find({
        collection: 'pending-exams',
        where: {
          driveUrl: {
            equals: file.webViewLink,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        continue
      }

      let finalDriveUrl = file.webViewLink || `https://google.com{file.id}/view`
      let finalMimeType = file.mimeType || 'application/pdf'
      let finalFilename = file.name || 'exam.pdf'

      console.log(`Importing file: ${file.name} (${file.webViewLink})`)
      await payload.create({
        collection: 'pending-exams',
        data: {
          filename: file.name,
          mimeType: file.mimeType,
          filesize: Number(file.size || 0),
          driveUrl: file.webViewLink,
          driveFileId: file.id,
          fileHash: file.md5Checksum || null,
          processed: false,
        },
      })

      imported++
    }

    return NextResponse.json({
      success: true,
      imported,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json({ error: 'Failed to sync pending exams' }, { status: 500 })
  }
}
