import type { BasePayload } from 'payload'
import { getDriveFileAsPdf } from '@/lib/googleDrive'
import { extractPdfImages } from '@/utils/extractPdfImages'
import { uploadExamImage, deleteExamImage } from '@/lib/cloudinary'

const ASSET_EXTRACTION_VERSION = 1
const STALE_PROCESSING_MS = 30 * 60 * 1000

interface EnsureExamAssetsParams {
  payload: BasePayload
  examId: string
  driveUrl: string
}

function detectImageFormat(data: Uint8Array): {
  mimeType: string
  extension: string
} {
  // JPEG
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' }
  }

  // PNG
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' }
  }

  // GIF
  if (
    data.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(Buffer.from(data.subarray(0, 6)).toString('ascii'))
  ) {
    return { mimeType: 'image/gif', extension: 'gif' }
  }

  // WebP
  if (
    data.length >= 12 &&
    Buffer.from(data.subarray(0, 4)).toString('ascii') === 'RIFF' &&
    Buffer.from(data.subarray(8, 12)).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' }
  }

  // TIFF
  if (
    data.length >= 4 &&
    ((data[0] === 0x49 && data[1] === 0x49 && data[2] === 0x2a && data[3] === 0x00) ||
      (data[0] === 0x4d && data[1] === 0x4d && data[2] === 0x00 && data[3] === 0x2a))
  ) {
    return { mimeType: 'image/tiff', extension: 'tif' }
  }

  throw new Error('Unsupported or unrecognized image format')
}

async function deleteAssetsForVersion(payload: BasePayload, examId: string, version: number) {
  const result = await payload.find({
    collection: 'exam-assets',
    where: {
      and: [{ exam: { equals: examId } }, { extractionVersion: { equals: version } }],
    },
    limit: 1000,
    pagination: false,
  })

  for (const asset of result.docs) {
    if (asset.cloudinaryPublicId) {
      await deleteExamImage(asset.cloudinaryPublicId)
    }

    await payload.delete({
      collection: 'exam-assets',
      id: asset.id,
    })
  }

  return result.docs.length
}

export async function ensureExamAssets({ payload, examId, driveUrl }: EnsureExamAssetsParams) {
  const exam = await payload.findByID({
    collection: 'exams',
    id: examId,
  })

  if (!exam) {
    throw new Error(`Exam ${examId} not found`)
  }

  // Cache hit
  if (
    exam.assetsProcessingStatus === 'complete' &&
    exam.assetsExtractionVersion === ASSET_EXTRACTION_VERSION
  ) {
    console.log(`Exam ${examId} assets already extracted.`)
    return
  }

  // Avoid starting another job while a recent one is running.
  if (exam.assetsProcessingStatus === 'processing') {
    const startedAt = exam.assetsProcessingStartedAt
      ? new Date(exam.assetsProcessingStartedAt).getTime()
      : 0

    const isStale = !startedAt || Date.now() - startedAt > STALE_PROCESSING_MS

    if (!isStale) {
      console.log(`Exam ${examId} assets are already being processed.`)
      return
    }

    console.log(`Exam ${examId} asset processing appears stale. Retrying.`)
  }

  try {
    await payload.update({
      collection: 'exams',
      id: examId,
      data: {
        assetsProcessingStatus: 'processing',
        assetsProcessingStartedAt: new Date().toISOString(),
        assetsProcessingError: null,
      },
    })

    console.log(`Downloading PDF for asset extraction: ${driveUrl}`)

    const downloadResult = await getDriveFileAsPdf(driveUrl)

    console.log(`Extracting images from exam ${examId} (${downloadResult.buffer.length} bytes)`)

    const images = await extractPdfImages(downloadResult.buffer)

    console.log(`Found ${images.length} embedded images in exam ${examId}`)

    // Remove partial assets from an earlier attempt of this version.
    const removed = await deleteAssetsForVersion(payload, examId, ASSET_EXTRACTION_VERSION)

    if (removed > 0) {
      console.log(`Removed ${removed} previous assets from exam ${examId}.`)
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const format = detectImageFormat(image.data)

      const filename = `exam-${examId}-page-${image.page}-image-${image.index}.${format.extension}`

      const publicId = `exam-assets/exam-${examId}/v${ASSET_EXTRACTION_VERSION}/page-${image.page}-image-${image.index}`

      console.log(`Uploading image ${i + 1}/${images.length}: ${filename}`)

      const uploaded = await uploadExamImage({
        data: image.data,
        publicId,
        mimeType: format.mimeType,
      })

      await payload.create({
        collection: 'exam-assets',
        data: {
          exam: Number(examId),
          imageUrl: uploaded.imageUrl,
          cloudinaryPublicId: uploaded.cloudinaryPublicId,
          cloudinaryAssetId: uploaded.cloudinaryAssetId,
          mimeType: uploaded.mimeType,
          page: image.page,
          imageIndex: image.index,
          width: image.width,
          height: image.height,
          extractionVersion: ASSET_EXTRACTION_VERSION,
        },
      })
    }

    // Extraction succeeded. Remove assets from older versions.
    const oldAssets = await payload.find({
      collection: 'exam-assets',
      where: {
        and: [
          { exam: { equals: examId } },
          {
            extractionVersion: {
              not_equals: ASSET_EXTRACTION_VERSION,
            },
          },
        ],
      },
      limit: 1000,
      pagination: false,
    })

    for (const asset of oldAssets.docs) {
      if (asset.cloudinaryPublicId) {
        await deleteExamImage(asset.cloudinaryPublicId)
      }

      await payload.delete({
        collection: 'exam-assets',
        id: asset.id,
      })
    }

    await payload.update({
      collection: 'exams',
      id: examId,
      data: {
        assetsProcessingStatus: 'complete',
        assetsProcessedAt: new Date().toISOString(),
        assetsProcessingStartedAt: null,
        assetsProcessingError: null,
        assetsExtractionVersion: ASSET_EXTRACTION_VERSION,
      },
    })

    console.log(`Exam ${examId} asset extraction complete. Uploaded ${images.length} images.`)
  } catch (error) {
    console.error(`Asset extraction failed for exam ${examId}:`, error)

    await payload.update({
      collection: 'exams',
      id: examId,
      data: {
        assetsProcessingStatus: 'failed',
        assetsProcessingError: error instanceof Error ? error.message : String(error),
        assetsProcessingStartedAt: null,
      },
    })

    throw error
  }
}
