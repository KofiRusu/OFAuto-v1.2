import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../../src/lib/db/prisma';
import { createCaller } from '../../src/lib/trpc/server';
import fs from 'fs/promises';
import path from 'path';

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