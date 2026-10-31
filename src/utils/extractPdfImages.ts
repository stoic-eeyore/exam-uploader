import { getPath } from 'pdf-parse/worker'
import { PDFParse } from 'pdf-parse'

// Configure the worker once, before creating PDFParse instances.
PDFParse.setWorker(getPath())

export type ExtractedImageMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/tiff'
  | 'application/octet-stream'

export interface ExtractedPdfImage {
  page: number
  index: number
  width: number
  height: number
  data: Uint8Array
  mimeType: ExtractedImageMimeType
  extension: string
}

function detectImageFormat(data: Uint8Array): {
  mimeType: ExtractedImageMimeType
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
  if (data.length >= 6 && String.fromCharCode(...data.slice(0, 6)).match(/^GIF8[79]a$/)) {
    return { mimeType: 'image/gif', extension: 'gif' }
  }

  // WebP: RIFF....WEBP
  if (
    data.length >= 12 &&
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
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

  return {
    mimeType: 'application/octet-stream',
    extension: 'bin',
  }
}

function fixArrayPrototype() {
  const descriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'random')

  if (descriptor?.enumerable && descriptor.configurable) {
    Object.defineProperty(Array.prototype, 'random', {
      ...descriptor,
      enumerable: false,
    })

    console.log('Fixed enumerable Array.prototype.random')
  }
}

export async function extractPdfImages(pdfBuffer: Buffer): Promise<ExtractedPdfImage[]> {
  fixArrayPrototype()

  const parser = new PDFParse({ data: pdfBuffer })

  try {
    console.log(
      'Array.prototype.random:',
      Object.getOwnPropertyDescriptor(Array.prototype, 'random'),
    )
    const result = await parser.getImage({
      imageBuffer: true,
      imageDataUrl: false,
      imageThreshold: 0,
    })

    const images: ExtractedPdfImage[] = []

    for (const page of result.pages) {
      for (const image of page.images ?? []) {
        const format = detectImageFormat(image.data)

        images.push({
          page: page.pageNumber,
          index: images.length,
          width: image.width,
          height: image.height,
          data: image.data,
          ...format,
        })
      }
    }

    return images
  } finally {
    await parser.destroy()
  }
}
