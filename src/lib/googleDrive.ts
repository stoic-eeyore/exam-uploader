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
