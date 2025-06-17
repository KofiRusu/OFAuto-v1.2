import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../../src/lib/db/prisma';
import { createCaller } from '../../src/lib/trpc/server';
import fs from 'fs/promises';
import path from 'path';
import { createTestContext } from '@/lib/test-utils/testContext';
import { mediaRouter } from '@/lib/trpc/routers/media';
import { mediaProcessingService } from '@/lib/services/mediaProcessingService';
import { addMediaProcessingJob } from '@/lib/queue';

// Mock auth context
const mockAuthContext = {
  userId: 'test-user-id',
  user: {
    id: 'test-user-id',
    role: 'ADMIN',
    email: 'test@example.com',
    name: 'Test User'
  },
  prisma,
};

// Mock AWS services
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');
jest.mock('@aws-sdk/s3-request-presigner');

// Mock watermark service
jest.mock('../../src/services/watermarkService', () => ({
  applyImageWatermark: jest.fn().mockImplementation(() => {
    return Promise.resolve(Buffer.from('mocked-watermarked-image'));
  }),
  uploadToS3: jest.fn().mockImplementation(() => {
    return Promise.resolve('https://test-bucket.s3.amazonaws.com/test-key');
  }),
  processAndUploadWatermarkedImage: jest.fn().mockImplementation(() => {
    return Promise.resolve('https://test-bucket.s3.amazonaws.com/watermarked/test-key');
  }),
}));

describe('Media API', () => {
  // Test data
  let testMediaId: string;
  let testWatermarkProfileId: string;
  let testImageBase64: string;
  
  beforeAll(async () => {
    // Create test user
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        clerkId: 'test-clerk-id',
        role: 'ADMIN',
      },
    });
    
    // Create test watermark profile
    const watermarkProfile = await prisma.watermarkProfile.create({
      data: {
        name: 'Test Watermark',
        logoUrl: 'https://test-bucket.s3.amazonaws.com/logo.png',
        opacity: 0.5,
        position: 'bottomRight',
        ownerId: 'test-user-id',
      },
    });
    
    testWatermarkProfileId = watermarkProfile.id;
    
    // Read test image
    try {
      const imageBuffer = await fs.readFile(path.join(__dirname, '../__fixtures__/test-image.jpg'));
      testImageBase64 = imageBuffer.toString('base64');
    } catch (error) {
      // Create a simple base64 image if fixture is not available
      testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.watermarkedMedia.deleteMany({
      where: { watermarkProfileId: testWatermarkProfileId },
    });
    
    await prisma.mediaAsset.deleteMany({
      where: { ownerId: 'test-user-id' },
    });
    
    await prisma.watermarkProfile.delete({
      where: { id: testWatermarkProfileId },
    });
    
    await prisma.user.delete({
      where: { id: 'test-user-id' },
    });
  });
  
  test('should upload media asset', async () => {
    // Create API caller
    const caller = createCaller(mockAuthContext);
    
    // Call upload media endpoint
    const result = await caller.media.uploadMedia({
      base64Data: `data:image/png;base64,${testImageBase64}`,
      fileName: 'test.png',
      contentType: 'image/png',
    });
    
    // Store ID for later tests
    testMediaId = result.id;
    
    // Assertions
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.url).toContain('https://');
  });
  
  test('should get media assets', async () => {
    // Create API caller
    const caller = createCaller(mockAuthContext);
    
    // Call get media assets endpoint
    const result = await caller.media.getMediaAssets({
      limit: 10,
    });
    
    // Assertions
    expect(result).toHaveProperty('items');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('url');
  });
  
  test('should get watermark profiles', async () => {
    // Create API caller
    const caller = createCaller(mockAuthContext);
    
    // Call get watermark profiles endpoint
    const result = await caller.media.getWatermarkProfiles({
      limit: 10,
    });
    
    // Assertions
    expect(result).toHaveProperty('items');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('name');
    expect(result.items[0]).toHaveProperty('logoUrl');
  });
  
  test('should apply watermark to media', async () => {
    // Skip if we don't have a media ID
    if (!testMediaId) {
      console.warn('Skipping watermark test because no media was uploaded');
      return;
    }
    
    // Create API caller
    const caller = createCaller(mockAuthContext);
    
    // Call apply watermark endpoint
    const result = await caller.media.applyWatermark({
      mediaId: testMediaId,
      watermarkProfileId: testWatermarkProfileId,
      options: {
        opacity: 0.7,
        position: 'bottomRight',
      },
    });
    
    // Assertions
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.url).toContain('https://');
  });
  
  test('should get processed media', async () => {
    // Skip if we don't have a media ID
    if (!testMediaId) {
      console.warn('Skipping get processed media test because no media was uploaded');
      return;
    }
    
    // Create API caller
    const caller = createCaller(mockAuthContext);
    
    // Call get processed media endpoint
    const result = await caller.media.getProcessedMedia({
      mediaId: testMediaId,
    });
    
    // Assertions
    expect(result).toHaveProperty('original');
    expect(result).toHaveProperty('watermarked');
    expect(result.original).toHaveProperty('id');
    expect(result.original).toHaveProperty('url');
    
    // Should have at least one watermarked version
    expect(result.watermarked.length).toBeGreaterThan(0);
  });
});

describe('Media Router', () => {
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
    jest.clearAllMocks();
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

      jest.mocked(prisma.mediaAsset.create).mockResolvedValue(mockMedia as any);

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

      jest.mocked(prisma.mediaAsset.create).mockResolvedValue(mockMedia as any);

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      jest.mocked(mediaProcessingService.uploadChunk).mockResolvedValue(mockChunk as any);
      jest.mocked(mediaProcessingService.getUploadProgress).mockResolvedValue(mockProgress);

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      jest.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);
      jest.mocked(mediaProcessingService.assembleChunks).mockResolvedValue('/path/to/file');

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      jest.mocked(mediaProcessingService.getUploadProgress).mockResolvedValue(mockProgress);

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);

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

      jest.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(mockMedia as any);
      jest.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);

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

      jest.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);

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

      jest.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);

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