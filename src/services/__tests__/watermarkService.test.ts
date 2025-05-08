import { applyImageWatermark, WatermarkOptions } from '../watermarkService';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Mock S3 Client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
}));

// Mock Upload from lib-storage
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

describe('Watermark Service', () => {
  let imageBuffer: Buffer;
  let logoBuffer: Buffer;

  beforeAll(async () => {
    // Load test images from fixtures
    try {
      imageBuffer = await fs.readFile(path.join(__dirname, '../../__fixtures__/test-image.jpg'));
      logoBuffer = await fs.readFile(path.join(__dirname, '../../__fixtures__/test-logo.png'));
    } catch (error) {
      // If fixtures don't exist, create sample buffers
      const testImage = sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      });
      
      const testLogo = sharp({
        create: {
          width: 200,
          height: 100,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0.8 }
        }
      });
      
      imageBuffer = await testImage.jpeg().toBuffer();
      logoBuffer = await testLogo.png().toBuffer();
    }
  });

  describe('applyImageWatermark', () => {
    it('should apply watermark with default options', async () => {
      const result = await applyImageWatermark(imageBuffer, logoBuffer);
      
      // Verify result is a Buffer
      expect(result).toBeInstanceOf(Buffer);
      
      // Verify result is different from original
      expect(result).not.toEqual(imageBuffer);
      
      // Check image dimensions remain the same
      const metadata = await sharp(result).metadata();
      const originalMetadata = await sharp(imageBuffer).metadata();
      expect(metadata.width).toBe(originalMetadata.width);
      expect(metadata.height).toBe(originalMetadata.height);
    });

    it('should apply watermark with custom position', async () => {
      const options: Partial<WatermarkOptions> = {
        position: 'topLeft',
        opacity: 0.7,
      };
      
      const result = await applyImageWatermark(imageBuffer, logoBuffer, options);
      
      // Verify result is a Buffer
      expect(result).toBeInstanceOf(Buffer);
      
      // Verify result is different from original
      expect(result).not.toEqual(imageBuffer);
    });

    it('should apply watermark with custom scale', async () => {
      const options: Partial<WatermarkOptions> = {
        position: 'center',
        scale: 0.5, // 50% of image size
      };
      
      const result = await applyImageWatermark(imageBuffer, logoBuffer, options);
      
      // Verify result is a Buffer
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw error for invalid image dimensions', async () => {
      // Create invalid image buffer
      const invalidBuffer = Buffer.from('not an image');
      
      await expect(applyImageWatermark(invalidBuffer, logoBuffer))
        .rejects
        .toThrow();
    });
  });
}); 