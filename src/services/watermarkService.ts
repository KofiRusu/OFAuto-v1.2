import sharp from 'sharp';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export interface WatermarkOptions {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
  opacity: number; // 0-1
  scale?: number; // 0-1, default 0.2 (20% of the image size)
  margin?: number; // pixels from the edge
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  position: 'bottomRight',
  opacity: 0.5,
  scale: 0.2,
  margin: 20,
};

// S3 client instance
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Apply watermark to an image
 * @param imageBuffer The original image buffer
 * @param logoBuffer The watermark logo buffer
 * @param options Watermark options
 * @returns Buffer of the watermarked image
 */
export async function applyImageWatermark(
  imageBuffer: Buffer,
  logoBuffer: Buffer,
  options: Partial<WatermarkOptions> = {}
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { position, opacity, scale, margin } = mergedOptions;

  // Get dimensions of the original image
  const metadata = await sharp(imageBuffer).metadata();
  const { width: originalWidth, height: originalHeight } = metadata;

  if (!originalWidth || !originalHeight) {
    throw new Error('Could not determine image dimensions');
  }

  // Resize logo based on scale factor
  const logoWidth = Math.round(originalWidth * (scale || 0.2));
  const resizedLogo = await sharp(logoBuffer)
    .resize(logoWidth)
    .composite([{ input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]), raw: { width: 1, height: 1, channels: 4 } }])
    .toBuffer();

  // Prepare logo metadata to get dimensions after resize
  const logoMetadata = await sharp(resizedLogo).metadata();
  const { width: watermarkWidth, height: watermarkHeight } = logoMetadata;

  if (!watermarkWidth || !watermarkHeight) {
    throw new Error('Could not determine watermark dimensions');
  }

  // Calculate position
  let left = margin;
  let top = margin;

  switch (position) {
    case 'topLeft':
      // already set defaults
      break;
    case 'topRight':
      left = originalWidth - watermarkWidth - margin;
      break;
    case 'bottomLeft':
      top = originalHeight - watermarkHeight - margin;
      break;
    case 'bottomRight':
      left = originalWidth - watermarkWidth - margin;
      top = originalHeight - watermarkHeight - margin;
      break;
    case 'center':
      left = Math.round((originalWidth - watermarkWidth) / 2);
      top = Math.round((originalHeight - watermarkHeight) / 2);
      break;
  }

  // Apply watermark
  return sharp(imageBuffer)
    .composite([
      {
        input: resizedLogo,
        top,
        left,
      },
    ])
    .toBuffer();
}

/**
 * Upload a file to S3
 * @param buffer The file buffer
 * @param key The S3 object key (path)
 * @param contentType The content type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET || 'ofauto-media';
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    },
  });

  await upload.done();
  return `https://${bucketName}.s3.amazonaws.com/${key}`;
}

/**
 * Process and watermark an image then upload to S3
 * @param imageBuffer Original image buffer
 * @param logoBuffer Watermark logo buffer
 * @param options Watermark options
 * @param key S3 object key
 * @param contentType Content type of the image
 * @returns URL of the watermarked image
 */
export async function processAndUploadWatermarkedImage(
  imageBuffer: Buffer,
  logoBuffer: Buffer,
  options: Partial<WatermarkOptions>,
  key: string,
  contentType: string
): Promise<string> {
  const watermarkedBuffer = await applyImageWatermark(imageBuffer, logoBuffer, options);
  return uploadToS3(watermarkedBuffer, key, contentType);
} 