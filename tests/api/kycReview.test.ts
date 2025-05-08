import { PrismaClient } from '@prisma/client';
import { createServerInner } from '@/lib/trpc/server';
import { appRouter } from '@/lib/trpc/router';
import { KycReviewStatus } from '@prisma/client';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Create a test database client
const prisma = new PrismaClient();

// Mock context
const mockAdminUser = {
  id: 'admin-user-id',
  role: 'ADMIN',
  email: 'admin@example.com',
  name: 'Admin User',
};

const mockContext = {
  userId: mockAdminUser.id,
  user: mockAdminUser,
  prisma,
};

// Create a test caller
const caller = appRouter.createCaller(mockContext);

describe('KYC Review API Integration Tests', () => {
  // Test data
  let testProfileId: string;
  let testReviewId: string;

  // Setup: Create test data before tests
  beforeEach(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-user@example.com',
        name: 'Test User',
        clerkId: 'test-clerk-id',
        role: 'USER',
      },
    });

    // Create a test onboarding profile
    const testProfile = await prisma.onboardingProfile.create({
      data: {
        userId: testUser.id,
        fullName: 'Test User',
        phoneNumber: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country',
        dateOfBirth: new Date('1990-01-01'),
        kycStatus: 'PENDING',
      },
    });

    testProfileId = testProfile.id;

    // Create a test KYC review
    const testReview = await prisma.kycReview.create({
      data: {
        profileId: testProfile.id,
        reviewerId: mockAdminUser.id,
        status: 'PENDING',
        documentUrls: [],
      },
    });

    testReviewId = testReview.id;
  });

  // Cleanup: Delete test data after tests
  afterEach(async () => {
    // Delete test data in reverse order
    await prisma.kycReview.deleteMany({
      where: { profileId: testProfileId },
    });

    await prisma.onboardingProfile.deleteMany({
      where: { id: testProfileId },
    });

    await prisma.user.deleteMany({
      where: { email: 'test-user@example.com' },
    });
  });

  describe('listPending', () => {
    it('should list pending KYC reviews', async () => {
      const result = await caller.kycReview.listPending({
        status: 'PENDING',
        limit: 10,
        offset: 0,
      });

      expect(result.profiles).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(1);
      
      // The test profile should be in the results
      const hasTestProfile = result.profiles.some(
        profile => profile.id === testProfileId
      );
      expect(hasTestProfile).toBe(true);
    });
  });

  describe('getByProfileId', () => {
    it('should get a KYC review by profile ID', async () => {
      const result = await caller.kycReview.getByProfileId({
        profileId: testProfileId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testProfileId);
      expect(result.reviews).toBeDefined();
      expect(result.reviews.length).toBeGreaterThanOrEqual(1);
      expect(result.reviews[0].id).toBe(testReviewId);
    });

    it('should throw error for non-existent profile', async () => {
      await expect(
        caller.kycReview.getByProfileId({
          profileId: 'non-existent-profile-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('approve', () => {
    it('should approve a KYC review and set reviewedAt', async () => {
      // Mock date for consistent testing
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      const result = await caller.kycReview.approve({
        id: testReviewId,
        reason: 'All documents verified',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('APPROVED');
      expect(result.reason).toBe('All documents verified');
      expect(result.reviewerId).toBe(mockAdminUser.id);
      
      // Check if reviewedAt is set
      expect(result.reviewedAt).toBeDefined();
      
      // Use toEqual for Date objects
      if (result.reviewedAt) {
        expect(result.reviewedAt.toISOString()).toEqual(mockDate.toISOString());
      }

      // Verify profile status is updated
      const updatedProfile = await prisma.onboardingProfile.findUnique({
        where: { id: testProfileId },
      });
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile?.kycStatus).toBe('VERIFIED');
      expect(updatedProfile?.kycCompletedAt).toBeDefined();

      // Reset system time
      vi.useRealTimers();
    });
  });

  describe('reject', () => {
    it('should reject a KYC review and set reviewedAt', async () => {
      // Mock date for consistent testing
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      const result = await caller.kycReview.reject({
        id: testReviewId,
        rejectionReason: 'Invalid documents',
        reason: 'Documents appear to be expired',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Invalid documents');
      expect(result.reason).toBe('Documents appear to be expired');
      expect(result.reviewerId).toBe(mockAdminUser.id);
      
      // Check if reviewedAt is set
      expect(result.reviewedAt).toBeDefined();
      
      // Use toEqual for Date objects
      if (result.reviewedAt) {
        expect(result.reviewedAt.toISOString()).toEqual(mockDate.toISOString());
      }

      // Verify profile status is updated
      const updatedProfile = await prisma.onboardingProfile.findUnique({
        where: { id: testProfileId },
      });
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile?.kycStatus).toBe('REJECTED');

      // Reset system time
      vi.useRealTimers();
    });
  });

  describe('requestAdditionalInfo', () => {
    it('should request additional info and set reviewedAt', async () => {
      // Mock date for consistent testing
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      const result = await caller.kycReview.requestAdditionalInfo({
        id: testReviewId,
        reason: 'Please provide clearer identification documents',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ADDITIONAL_INFO_REQUESTED');
      expect(result.reason).toBe('Please provide clearer identification documents');
      expect(result.reviewerId).toBe(mockAdminUser.id);
      
      // Check if reviewedAt is set
      expect(result.reviewedAt).toBeDefined();
      
      // Use toEqual for Date objects
      if (result.reviewedAt) {
        expect(result.reviewedAt.toISOString()).toEqual(mockDate.toISOString());
      }

      // Verify profile status is updated
      const updatedProfile = await prisma.onboardingProfile.findUnique({
        where: { id: testProfileId },
      });
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile?.kycStatus).toBe('REVIEW');

      // Reset system time
      vi.useRealTimers();
    });
  });

  describe('create', () => {
    it('should create a new KYC review', async () => {
      // Create a second review for the same profile
      const result = await caller.kycReview.create({
        profileId: testProfileId,
        reason: 'Follow-up review',
      });

      expect(result).toBeDefined();
      expect(result.profileId).toBe(testProfileId);
      expect(result.status).toBe('PENDING');
      expect(result.reason).toBe('Follow-up review');
      expect(result.reviewerId).toBe(mockAdminUser.id);
      expect(result.documentUrls).toEqual([]);
      
      // reviewedAt should not be set for a new review
      expect(result.reviewedAt).toBeNull();
    });
  });
}); 