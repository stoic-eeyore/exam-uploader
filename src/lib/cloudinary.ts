import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface UploadExamImageParams {
  data: Uint8Array
  publicId: string
  mimeType: string
}

export async function uploadExamImage({ data, publicId, mimeType }: UploadExamImageParams) {
  return new Promise<{
    imageUrl: string
    cloudinaryPublicId: string
    cloudinaryAssetId: string
    mimeType: string
    width: number
    height: number
  }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        if (!result) {
          reject(new Error('Cloudinary returned no upload result'))
          return
        }

        resolve({
          imageUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
          cloudinaryAssetId: result.asset_id,
          mimeType,
          width: result.width,
          height: result.height,
        })
      },
    )

    upload.end(Buffer.from(data))
  })
}

export async function deleteExamImage(publicId: string) {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    invalidate: true,
  })

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Failed to delete Cloudinary image ${publicId}: ${result.result}`)
  }
}
