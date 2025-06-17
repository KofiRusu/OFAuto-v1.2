import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaProcessingService } from '../mediaProcessingService';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    mediaAsset: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mediaChunk: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    open: vi.fn(),
    stat: vi.fn(),
  },
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
    }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({}),
  })),
}));

describe('MediaProcessingService', () => {
  const mockMediaId = 'media-123';
  const mockUserId = 'user-123';
  const mockBuffer = Buffer.from('test data');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadChunk', () => {
    it('should upload a new chunk successfully', async () => {
      const mockMedia = {
        id: mockMediaId,
        userId: mockUserId,
        status: 'PENDING',
      };

      const mockChunk = {
        id: 'chunk-123',
        mediaId: mockMediaId,
        chunkIndex: 0,
        size: mockBuffer.length,
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaChunk.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.mediaChunk.create).mockResolvedValue(mockChunk as any);

      const result = await mediaProcessingService.uploadChunk({
        mediaId: mockMediaId,
        chunkIndex: 0,
        buffer: mockBuffer,
      });

      expect(result).toEqual(mockChunk);
      expect(prisma.mediaAsset.findUnique).toHaveBeenCalledWith({
        where: { id: mockMediaId },
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(prisma.mediaChunk.create).toHaveBeenCalledWith({
        data: {
          mediaId: mockMediaId,
          chunkIndex: 0,
          size: mockBuffer.length,
        },
      });
    });

    it('should return existing chunk if already uploaded', async () => {
      const mockMedia = {
        id: mockMediaId,
        userId: mockUserId,
        status: 'PENDING',
      };

      const mockChunk = {
        id: 'chunk-123',
        mediaId: mockMediaId,
        chunkIndex: 0,
        size: mockBuffer.length,
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaChunk.findUnique).mockResolvedValue(mockChunk as any);

      const result = await mediaProcessingService.uploadChunk({
        mediaId: mockMediaId,
        chunkIndex: 0,
        buffer: mockBuffer,
      });

      expect(result).toEqual(mockChunk);
      expect(prisma.mediaChunk.create).not.toHaveBeenCalled();
    });

    it('should throw error if media not found', async () => {
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(null);

      await expect(
        mediaProcessingService.uploadChunk({
          mediaId: mockMediaId,
          chunkIndex: 0,
          buffer: mockBuffer,
        })
      ).rejects.toThrow('Media asset not found');
    });
  });

  describe('assembleChunks', () => {
    it('should assemble chunks into final file', async () => {
      const mockMedia = {
        id: mockMediaId,
        userId: mockUserId,
        filename: 'test.jpg',
        chunks: [
          { id: 'chunk-1', mediaId: mockMediaId, chunkIndex: 0 },
          { id: 'chunk-2', mediaId: mockMediaId, chunkIndex: 1 },
        ],
      };

      const mockWriteStream = {
        write: vi.fn(),
        close: vi.fn(),
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);
      vi.mocked(fs.open).mockResolvedValue(mockWriteStream as any);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(prisma.mediaChunk.deleteMany).mockResolvedValue({} as any);

      const result = await mediaProcessingService.assembleChunks(mockMediaId);

      expect(result).toContain(`${mockMediaId}_test.jpg`);
      expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
        where: { id: mockMediaId },
        data: { status: 'PROCESSING' },
      });
      expect(mockWriteStream.write).toHaveBeenCalledTimes(2);
      expect(mockWriteStream.close).toHaveBeenCalled();
      expect(prisma.mediaChunk.deleteMany).toHaveBeenCalledWith({
        where: { mediaId: mockMediaId },
      });
    });
  });

  describe('processMediaTask', () => {
    it('should process image successfully', async () => {
      const mockMedia = {
        id: mockMediaId,
        userId: mockUserId,
        filename: 'test.jpg',
        type: 'image',
        url: '',
      };

      const mockStats = {
        size: 1024 * 1024, // 1MB
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);

      const result = await mediaProcessingService.processMediaTask({
        mediaId: mockMediaId,
        taskId: 'task-123',
      });

      expect(result.success).toBe(true);
      expect(result.mediaId).toBe(mockMediaId);
      expect(result.metadata).toHaveProperty('width', 1920);
      expect(result.metadata).toHaveProperty('height', 1080);
      expect(prisma.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMediaId },
          data: expect.objectContaining({
            status: 'READY',
            width: 1920,
            height: 1080,
          }),
        })
      );
    });

    it('should handle processing failure', async () => {
      vi.mocked(prisma.mediaAsset.findUnique).mockRejectedValue(new Error('Database error'));
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);

      const result = await mediaProcessingService.processMediaTask({
        mediaId: mockMediaId,
        taskId: 'task-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(prisma.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMediaId },
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });
  });

  describe('getUploadProgress', () => {
    it('should calculate upload progress correctly', async () => {
      const mockMedia = {
        id: mockMediaId,
        fileSize: 5 * 1024 * 1024, // 5MB
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaChunk.count).mockResolvedValue(3);

      const result = await mediaProcessingService.getUploadProgress(mockMediaId);

      expect(result.uploadedChunks).toBe(3);
      expect(result.totalChunks).toBe(5); // 5MB / 1MB chunks
      expect(result.percentage).toBe(60); // 3/5 * 100
    });

    it('should return zero progress for missing media', async () => {
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(null);

      const result = await mediaProcessingService.getUploadProgress(mockMediaId);

      expect(result).toEqual({
        uploadedChunks: 0,
        totalChunks: 0,
        percentage: 0,
      });
    });
  });
}); 