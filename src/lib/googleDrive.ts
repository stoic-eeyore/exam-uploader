import { google } from 'googleapis'
import fs from 'fs'
import { Readable } from 'stream'

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({
  version: 'v3',
  auth,
})

function sanitizeFolderName(name: string) {
  return name.replace(/\//g, '-')
}

async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
  const query = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${name}'`,
    `trashed=false`,
    parentId ? `'${parentId}' in parents` : '',
  ].join(' and ')

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  // Create folder if not exists
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
    supportsAllDrives: true,
  })

  return folder.data.id!
}

async function getFolderPathIds({
  year,
  grade,
  subject,
}: {
  year: string
  grade: string
  subject: string
}) {
  const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID!

  const yearFolder = await findOrCreateFolder(sanitizeFolderName(year), rootId)
  const gradeFolder = await findOrCreateFolder(grade, yearFolder)
  const subjectFolder = await findOrCreateFolder(subject, gradeFolder)

  return subjectFolder
}

export async function uploadToDrive({
  buffer,
  filename,
  mimeType,
  year,
  grade,
  subject,
}: {
  buffer: Buffer
  filename: string
  mimeType: string
  year: string
  grade: string
  subject: string
}) {
  const parentFolderId = await getFolderPathIds({
    year,
    grade,
    subject,
  })

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [parentFolderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer), // <-- important
    },
    supportsAllDrives: true,
    fields: 'id',
  })

  const fileId = response.data.id!

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  })

  return `https://drive.google.com/file/d/${fileId}/view`
}

export function extractDriveFileId(url: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)

  return match?.[1]
}

export async function downloadDriveFile(
  driveUrl: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const fileId = extractDriveFileId(driveUrl)
  if (!fileId) {
    throw new Error('Invalid Drive URL')
  }

  console.log("Retrieving meta-data")
  // 1. Fetch metadata to determine if the file is a Word document
  const metadata = await drive.files.get({
    fileId,
    fields: 'mimeType, name',
    supportsAllDrives: true,
  })

  const currentMimeType = metadata.data.mimeType

  // 🔍 Intercept step: If it's a DOCX file, convert it to a PDF on-the-fly
  if (
    currentMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    let tempGoogleDocId: string | null = null

    try {
      // Step A: Copy and translate the .docx into a temporary Google Doc
      const docCopy = await drive.files.copy({
        fileId: fileId,
        requestBody: {
          name: `Temp_Conv_${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
        },
        supportsAllDrives: true,
        fields: 'id',
      })

      tempGoogleDocId = docCopy.data.id || null
      if (!tempGoogleDocId) throw new Error('Google Doc translation failed')

      // Step B: Export that temporary Google Doc as a PDF binary stream
      const pdfExport = await drive.files.export(
        {
          fileId: tempGoogleDocId,
          mimeType: 'application/pdf',
        },
        {
          responseType: 'arraybuffer',
        },
      )

      return {
        buffer: Buffer.from(pdfExport.data as ArrayBuffer),
        mimeType: 'application/pdf', // Explicitly override the returned mimeType
      }
    } finally {
      // Step C: Cleanup - trash the temporary Google Doc right away
      if (tempGoogleDocId) {
        await drive.files
          .delete({
            fileId: tempGoogleDocId,
            supportsAllDrives: true,
          })
          .catch((err) => console.error('Failed to clean temp doc:', err))
      }
    }
  }

  // 2. Standard Workflow: Download native PDFs normally
  console.log("downloading pdf")
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
      acknowledgeAbuse: true,
    },
    {
      responseType: 'arraybuffer',
    },
  )

  return {
    buffer: Buffer.from(response.data as ArrayBuffer),
    mimeType: currentMimeType || 'application/pdf',
  }
}

export async function listDriveFiles(folderId: string) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, webViewLink, md5Checksum)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  return response.data.files || []
}

/**
 * Converts a .docx file on Google Drive to a Google Doc, exports it as a PDF buffer,
 * and saves the new PDF file back to the destination folder on Google Drive.
 */
export async function convertDriveDocxToPdfFile({
  fileId,
  filename,
  parentFolderId,
}: {
  fileId: string
  filename: string
  parentFolderId: string
}): Promise<{ pdfUrl: string; pdfMimeType: string; pdfFilename: string }> {
  let tempGoogleDocId: string | null = null

  try {
    // 1. Convert DOCX file into a temporary Native Google Doc copy
    const docCopy = await drive.files.copy({
      fileId,
      requestBody: {
        name: `Temp_Conv_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.document', // 🚀 Translate target format
        parents: [parentFolderId],
      },
      supportsAllDrives: true,
      fields: 'id',
    })

    tempGoogleDocId = docCopy.data.id || null
    if (!tempGoogleDocId) throw new Error('Google Doc translation instantiation failed.')

    // 2. Export the newly created temporary Google Doc as a PDF binary ArrayBuffer
    const pdfExport = await drive.files.export(
      {
        fileId: tempGoogleDocId,
        mimeType: 'application/pdf', // 🚀 Request conversion format
      },
      {
        responseType: 'arraybuffer',
      },
    )
    const pdfBuffer = Buffer.from(pdfExport.data as ArrayBuffer)

    // 3. Save the clean PDF buffer back onto Google Drive in the same folder
    const targetFilename = filename.replace(/\.docx$/i, '.pdf')
    const driveUploadResponse = await drive.files.create({
      requestBody: {
        name: targetFilename,
        parents: [parentFolderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
      },
      supportsAllDrives: true,
      fields: 'id',
    })

    const newPdfFileId = driveUploadResponse.data.id!

    // 4. Set permissions so the file is viewable
    await drive.permissions.create({
      fileId: newPdfFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    })

    return {
      pdfUrl: `https://google.com{newPdfFileId}/view`,
      pdfMimeType: 'application/pdf',
      pdfFilename: targetFilename,
    }
  } catch (error) {
    console.error('Google Drive Cloud Pipeline conversion failure:', error)
    throw error
  } finally {
    // 5. Cleanup: Always trash the intermediate temporary Google Doc
    if (tempGoogleDocId) {
      await drive.files
        .delete({
          fileId: tempGoogleDocId,
          supportsAllDrives: true,
        })
        .catch((err) => console.error('Failsafe cleaning error:', err))
    }
  }
}

export async function organizeInDrive(
  fileId: string,
  oldFolderId: string,
  year: string,
  grade: string,
  subject: string,
  newFileName: string,
) {
  const parentFolderId = await getFolderPathIds({
    year,
    grade,
    subject,
  })

  await drive.files.update({
    fileId,
    addParents: parentFolderId,
    removeParents: oldFolderId,
    supportsAllDrives: true,
    fields: 'id, name, parents',

    requestBody: {
      name: newFileName,
    },
  })
}
