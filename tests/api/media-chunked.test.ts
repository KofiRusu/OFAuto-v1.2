import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContext } from '@/lib/test-utils/testContext';
import { mediaRouter } from '@/lib/trpc/routers/media';
import { prisma } from '@/lib/db';
import { mediaProcessingService } from '@/lib/services/mediaProcessingService';
import { addMediaProcessingJob } from '@/lib/queue';

vi.mock('@/lib/db', () => ({
  prisma: {
    mediaAsset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    mediaChunk: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/mediaProcessingService', () => ({
  mediaProcessingService: {
    uploadChunk: vi.fn(),
    assembleChunks: vi.fn(),
    getUploadProgress: vi.fn(),
  },
}));

vi.mock('@/lib/queue', () => ({
  addMediaProcessingJob: vi.fn(),
}));

describe('Media Router - Chunked Upload', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  const mockManager = {
    id: 'manager-123',
    email: 'manager@example.com',
    role: 'MANAGER',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startUpload', () => {
    it('should start a new upload', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: mockUser.id,
        filename: 'test.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
        type: 'image',
        status: 'PENDING',
        url: '',
      };

      vi.mocked(prisma.mediaAsset.create).mockResolvedValue(mockMedia as any);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.startUpload({
        filename: 'test.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
      });

      expect(result).toEqual({
        mediaId: mockMedia.id,
        chunkSize: 1048576,
      });

      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          filename: 'test.jpg',
          fileSize: 1024 * 1024,
          mimeType: 'image/jpeg',
          type: 'image',
          status: 'PENDING',
          url: '',
        },
      });
    });

    it('should detect video type from mime type', async () => {
      const mockMedia = {
        id: 'media-123',
        type: 'video',
      };

      vi.mocked(prisma.mediaAsset.create).mockResolvedValue(mockMedia as any);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      await caller.startUpload({
        filename: 'test.mp4',
        fileSize: 10 * 1024 * 1024,
        mimeType: 'video/mp4',
      });

      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'video',
        }),
      });
    });
  });

  describe('uploadChunk', () => {
    it('should upload a chunk successfully', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: mockUser.id,
      };

      const mockChunk = {
        id: 'chunk-123',
        mediaId: 'media-123',
        chunkIndex: 0,
      };

      const mockProgress = {
        uploadedChunks: 1,
        totalChunks: 5,
        percentage: 20,
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(mediaProcessingService.uploadChunk).mockResolvedValue(mockChunk as any);
      vi.mocked(mediaProcessingService.getUploadProgress).mockResolvedValue(mockProgress);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.uploadChunk({
        mediaId: 'media-123',
        chunkIndex: 0,
        chunkData: 'base64data',
      });

      expect(result).toEqual({
        chunkId: mockChunk.id,
        progress: mockProgress,
      });

      expect(mediaProcessingService.uploadChunk).toHaveBeenCalledWith({
        mediaId: 'media-123',
        chunkIndex: 0,
        buffer: expect.any(Buffer),
      });
    });

    it('should deny access to other users media', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: 'other-user',
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      await expect(
        caller.uploadChunk({
          mediaId: 'media-123',
          chunkIndex: 0,
          chunkData: 'base64data',
        })
      ).rejects.toThrow('Media not found or access denied');
    });
  });

  describe('finishUpload', () => {
    it('should finish upload and start processing', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: mockUser.id,
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);
      vi.mocked(mediaProcessingService.assembleChunks).mockResolvedValue('/path/to/file');

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.finishUpload({
        mediaId: 'media-123',
      });

      expect(result.mediaId).toBe('media-123');
      expect(result.status).toBe('PROCESSING');
      expect(result.taskId).toBeDefined();

      expect(mediaProcessingService.assembleChunks).toHaveBeenCalledWith('media-123');
      expect(addMediaProcessingJob).toHaveBeenCalledWith({
        mediaId: 'media-123',
        taskId: result.taskId,
        type: 'process',
      });
    });
  });

  describe('getMediaStatus', () => {
    it('should return media status with upload progress', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: mockUser.id,
        status: 'PENDING',
        url: '',
        metadata: null,
        processedAt: null,
        processingTimeMs: null,
        chunks: [{ id: 'chunk-1' }],
      };

      const mockProgress = {
        uploadedChunks: 3,
        totalChunks: 5,
        percentage: 60,
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(mediaProcessingService.getUploadProgress).mockResolvedValue(mockProgress);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.getMediaStatus({
        mediaId: 'media-123',
      });

      expect(result).toEqual({
        id: 'media-123',
        status: 'PENDING',
        url: '',
        metadata: null,
        processedAt: null,
        processingTimeMs: null,
        uploadProgress: mockProgress,
      });
    });

    it('should allow managers to view any media', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: 'other-user',
        status: 'READY',
        chunks: [],
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);

      const ctx = createTestContext({ user: mockManager });
      const caller = mediaRouter.createCaller(ctx);

      await expect(
        caller.getMediaStatus({ mediaId: 'media-123' })
      ).resolves.toBeDefined();
    });
  });

  describe('reprocessMedia', () => {
    it('should reprocess media (manager only)', async () => {
      const mockMedia = {
        id: 'media-123',
        userId: 'any-user',
      };

      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);

      const ctx = createTestContext({ user: mockManager });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.reprocessMedia({
        mediaId: 'media-123',
      });

      expect(result.mediaId).toBe('media-123');
      expect(result.status).toBe('PROCESSING');
      expect(result.taskId).toBeDefined();

      expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
        where: { id: 'media-123' },
        data: {
          status: 'PROCESSING',
          taskId: result.taskId,
          processedAt: null,
          processingTimeMs: null,
        },
      });

      expect(addMediaProcessingJob).toHaveBeenCalledWith({
        mediaId: 'media-123',
        taskId: result.taskId,
        type: 'process',
      });
    });

    it('should deny access to non-managers', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      await expect(
        caller.reprocessMedia({ mediaId: 'media-123' })
      ).rejects.toThrow();
    });
  });

  describe('getMediaAssets', () => {
    it('should return user media assets', async () => {
      const mockAssets = [
        { id: 'media-1', userId: mockUser.id },
        { id: 'media-2', userId: mockUser.id },
      ];

      vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);

      const ctx = createTestContext({ user: mockUser });
      const caller = mediaRouter.createCaller(ctx);

      const result = await caller.getMediaAssets({
        limit: 10,
      });

      expect(result.items).toEqual(mockAssets);
      expect(result.nextCursor).toBeUndefined();

      expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith({
        where: { ownerId: mockUser.id },
        take: 11,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should allow managers to filter by owner', async () => {
      const mockAssets = [
        { id: 'media-1', userId: 'other-user' },
      ];

      vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);

      const ctx = createTestContext({ user: mockManager });
      const caller = mediaRouter.createCaller(ctx);

      await caller.getMediaAssets({
        limit: 10,
        filterByOwnerId: 'other-user',
      });

      expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'other-user' },
        take: 11,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
}); 