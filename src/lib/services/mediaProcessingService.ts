import { prisma } from '@/lib/db';
import { MediaAsset, MediaChunk } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface ChunkUploadParams {
  mediaId: string;
  chunkIndex: number;
  buffer: Buffer;
}

export interface ProcessingResult {
  success: boolean;
  mediaId: string;
  processingTimeMs?: number;
  error?: string;
  metadata?: any;
}

export class MediaProcessingService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly chunkDir = path.join(this.uploadDir, 'chunks');
  private readonly processedDir = path.join(this.uploadDir, 'processed');
  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB
  private readonly chunkSize = parseInt(process.env.CHUNK_SIZE || '1048576'); // 1MB

  constructor() {
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.chunkDir, { recursive: true });
    await fs.mkdir(this.processedDir, { recursive: true });
  }

  /**
   * Upload a single chunk of a media file
   */
  async uploadChunk({ mediaId, chunkIndex, buffer }: ChunkUploadParams): Promise<MediaChunk> {
    // Validate media exists
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new Error('Media asset not found');
    }

    // Check if chunk already exists
    const existingChunk = await prisma.mediaChunk.findUnique({
      where: {
        mediaId_chunkIndex: {
          mediaId,
          chunkIndex
        }
      }
    });

    if (existingChunk) {
      return existingChunk;
    }

    // Save chunk to filesystem
    const chunkPath = path.join(this.chunkDir, `${mediaId}_${chunkIndex}`);
    await fs.writeFile(chunkPath, buffer);

    // Create chunk record
    const chunk = await prisma.mediaChunk.create({
      data: {
        mediaId,
        chunkIndex,
        size: buffer.length
      }
    });

    return chunk;
  }

  /**
   * Assemble all chunks into the final file
   */
  async assembleChunks(mediaId: string): Promise<string> {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
    });

    if (!media) {
      throw new Error('Media asset not found');
    }

    // Update status to processing
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { status: 'PROCESSING' }
    });

    const outputPath = path.join(this.uploadDir, `${mediaId}_${media.filename}`);
    const writeStream = await fs.open(outputPath, 'w');

    try {
      // Read and write each chunk in order
      for (const chunk of media.chunks) {
        const chunkPath = path.join(this.chunkDir, `${mediaId}_${chunk.chunkIndex}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
      }
    } finally {
      await writeStream.close();
    }

    // Clean up chunk files
    for (const chunk of media.chunks) {
      const chunkPath = path.join(this.chunkDir, `${mediaId}_${chunk.chunkIndex}`);
      await fs.unlink(chunkPath).catch(() => {}); // Ignore errors
    }

    // Delete chunk records
    await prisma.mediaChunk.deleteMany({
      where: { mediaId }
    });

    return outputPath;
  }

  /**
   * Enqueue media for background processing
   */
  async enqueueProcessing(mediaId: string): Promise<string> {
    const taskId = uuidv4();

    // Update media with task ID
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        taskId,
        status: 'PROCESSING'
      }
    });

    // In a real implementation, this would add to a job queue
    // For now, we'll process synchronously
    setTimeout(() => {
      this.processMediaTask({ mediaId, taskId });
    }, 0);

    return taskId;
  }

  /**
   * Process media: compression, thumbnail generation, metadata extraction
   */
  async processMediaTask(job: { mediaId: string; taskId: string }): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const media = await prisma.mediaAsset.findUnique({
        where: { id: job.mediaId }
      });

      if (!media) {
        throw new Error('Media asset not found');
      }

      const inputPath = path.join(this.uploadDir, `${media.id}_${media.filename}`);
      const metadata: any = {};

      // Process based on media type
      if (media.type === 'image') {
        const processedPath = path.join(this.processedDir, `${media.id}_processed.jpg`);
        
        // Process image with sharp
        const image = sharp(inputPath);
        const imageMetadata = await image.metadata();
        
        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;
        metadata.format = imageMetadata.format;

        // Resize if too large
        if (imageMetadata.width && imageMetadata.width > 2048) {
          await image
            .resize(2048, null, { withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toFile(processedPath);
        } else {
          await image
            .jpeg({ quality: 85, progressive: true })
            .toFile(processedPath);
        }

        // Generate thumbnail
        const thumbnailPath = path.join(this.processedDir, `${media.id}_thumb.jpg`);
        await sharp(inputPath)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        metadata.thumbnailUrl = `/processed/${media.id}_thumb.jpg`;
        metadata.processedUrl = `/processed/${media.id}_processed.jpg`;

        // Get file size
        const stats = await fs.stat(processedPath);
        metadata.fileSize = stats.size;
      } else if (media.type === 'video') {
        // Video processing would go here (ffmpeg integration)
        metadata.processedUrl = `/uploads/${media.id}_${media.filename}`;
      } else if (media.type === 'audio') {
        // Audio processing would go here
        metadata.processedUrl = `/uploads/${media.id}_${media.filename}`;
      }

      const processingTimeMs = Date.now() - startTime;

      // Update media asset
      await prisma.mediaAsset.update({
        where: { id: job.mediaId },
        data: {
          status: 'READY',
          processedAt: new Date(),
          processingTimeMs,
          metadata,
          width: metadata.width,
          height: metadata.height,
          fileSize: metadata.fileSize,
          url: metadata.processedUrl || media.url
        }
      });

      return {
        success: true,
        mediaId: job.mediaId,
        processingTimeMs,
        metadata
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      // Update media as failed
      await prisma.mediaAsset.update({
        where: { id: job.mediaId },
        data: {
          status: 'FAILED',
          processingTimeMs
        }
      });

      return {
        success: false,
        mediaId: job.mediaId,
        processingTimeMs,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get chunk upload progress
   */
  async getUploadProgress(mediaId: string): Promise<{ uploadedChunks: number; totalChunks: number; percentage: number }> {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId }
    });

    if (!media || !media.fileSize) {
      return { uploadedChunks: 0, totalChunks: 0, percentage: 0 };
    }

    const totalChunks = Math.ceil(media.fileSize / this.chunkSize);
    const uploadedChunks = await prisma.mediaChunk.count({
      where: { mediaId }
    });

    const percentage = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;

    return {
      uploadedChunks,
      totalChunks,
      percentage
    };
  }
}

export const mediaProcessingService = new MediaProcessingService(); 