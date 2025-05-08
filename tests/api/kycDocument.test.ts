import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { createCaller } from '@/lib/trpc/routers/caller';
import { prisma } from '@/lib/prisma';
import { appRouter } from '@/lib/trpc/router';

// Mock data
const testUsers = {
  admin: { id: 'admin-user-id', role: 'ADMIN', clerkId: 'clerk-admin-id' },
  manager: { id: 'manager-user-id', role: 'MANAGER', clerkId: 'clerk-manager-id' },
  user: { id: 'regular-user-id', role: 'USER', clerkId: 'clerk-user-id' },
};

// Mock KYC document
const testDocument = {
  id: 'test-doc-id',
  userId: testUsers.user.id,
  type: 'ID_FRONT',
  fileUrl: 'https://example.com/document.pdf',
  status: 'PENDING',
  submittedAt: new Date(),
  reviewedAt: null,
  reviewerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    kycDocument: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((queries) => Promise.all(queries)),
  }
}));

describe('KYC Document API integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitKycDoc procedure', () => {
    it('should create a document when valid data is provided by the user', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Mock Prisma responses
      prisma.kycDocument.create = vi.fn().mockResolvedValue({
        ...testDocument,
        user: {
          id: testUsers.user.id,
          name: 'Regular User',
          email: 'user@example.com',
        },
      });

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the submitKycDoc procedure
      const result = await caller.kycDocument.submitKycDoc({
        userId: testUsers.user.id,
        type: 'ID_FRONT',
        fileUrl: 'https://example.com/document.pdf',
      });

      // Verify the response
      expect(result).toHaveProperty('id');
      expect(result.userId).toBe(testUsers.user.id);
      expect(result.type).toBe('ID_FRONT');
      expect(result.status).toBe('PENDING');

      // Verify interactions
      expect(prisma.kycDocument.create).toHaveBeenCalledWith({
        data: {
          userId: testUsers.user.id,
          type: 'ID_FRONT',
          fileUrl: 'https://example.com/document.pdf',
          status: 'PENDING',
        },
        include: expect.any(Object),
      });
    });

    it('should reject when a user tries to submit for another user', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the submitKycDoc procedure with different userId
      await expect(caller.kycDocument.submitKycDoc({
        userId: 'different-user-id',
        type: 'ID_FRONT',
        fileUrl: 'https://example.com/document.pdf',
      })).rejects.toThrow(/You can only submit documents for your own account/);
    });

    it('should allow admin to submit for another user', async () => {
      // Mock context for an admin user
      const ctx = {
        userId: testUsers.admin.id,
        user: testUsers.admin,
        prisma,
      };

      // Mock Prisma responses
      prisma.kycDocument.create = vi.fn().mockResolvedValue({
        ...testDocument,
        user: {
          id: testUsers.user.id,
          name: 'Regular User',
          email: 'user@example.com',
        },
      });

      // Create a caller with the admin context
      const caller = appRouter.createCaller(ctx);

      // Call the submitKycDoc procedure with a different userId
      const result = await caller.kycDocument.submitKycDoc({
        userId: testUsers.user.id,
        type: 'ID_FRONT',
        fileUrl: 'https://example.com/document.pdf',
      });

      // Verify the response
      expect(result).toHaveProperty('id');
      expect(result.userId).toBe(testUsers.user.id);

      // Verify interactions
      expect(prisma.kycDocument.create).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('getUserKycDocs procedure', () => {
    it('should return documents for a user when requested by themselves', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Mock document list response
      const mockDocuments = [
        {
          ...testDocument,
          user: {
            id: testUsers.user.id,
            name: 'Regular User',
            email: 'user@example.com',
          },
        }
      ];

      // Mock Prisma responses
      prisma.kycDocument.findMany = vi.fn().mockResolvedValue(mockDocuments);
      prisma.kycDocument.count = vi.fn().mockResolvedValue(1);

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the getUserKycDocs procedure
      const result = await caller.kycDocument.getUserKycDocs({});

      // Verify the response
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].userId).toBe(testUsers.user.id);
      expect(result.pagination.total).toBe(1);

      // Verify Prisma interactions - user should only see their own documents
      expect(prisma.kycDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: testUsers.user.id },
      }));
    });

    it('should return documents for a specific user when requested by a manager', async () => {
      // Mock context for a manager user
      const ctx = {
        userId: testUsers.manager.id,
        user: testUsers.manager,
        prisma,
      };

      // Mock document list response
      const mockDocuments = [
        {
          ...testDocument,
          user: {
            id: testUsers.user.id,
            name: 'Regular User',
            email: 'user@example.com',
          },
        }
      ];

      // Mock Prisma responses
      prisma.kycDocument.findMany = vi.fn().mockResolvedValue(mockDocuments);
      prisma.kycDocument.count = vi.fn().mockResolvedValue(1);

      // Create a caller with the manager context
      const caller = appRouter.createCaller(ctx);

      // Call the getUserKycDocs procedure with a specific userId
      const result = await caller.kycDocument.getUserKycDocs({
        userId: testUsers.user.id,
      });

      // Verify the response
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].userId).toBe(testUsers.user.id);
      expect(result.pagination.total).toBe(1);

      // Verify Prisma interactions - manager should be able to filter by userId
      expect(prisma.kycDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: testUsers.user.id },
      }));
    });

    it('should reject when a regular user tries to view another user\'s documents', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the getUserKycDocs procedure with a different userId
      await expect(caller.kycDocument.getUserKycDocs({
        userId: 'different-user-id',
      })).rejects.toThrow(/You can only view your own documents/);
    });
  });

  describe('reviewKycDoc procedure', () => {
    it('should update document status when a manager reviews it', async () => {
      // Mock context for a manager user
      const ctx = {
        userId: testUsers.manager.id,
        user: testUsers.manager,
        prisma,
      };

      // Mock the existing document
      prisma.kycDocument.findUnique = vi.fn().mockResolvedValue({
        ...testDocument,
        status: 'PENDING',
      });

      // Mock the updated document
      const mockUpdatedDocument = {
        ...testDocument,
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewerId: testUsers.manager.id,
        user: {
          id: testUsers.user.id,
          name: 'Regular User',
          email: 'user@example.com',
        },
        reviewer: {
          id: testUsers.manager.id,
          name: 'Manager User',
          email: 'manager@example.com',
        },
      };
      
      prisma.kycDocument.update = vi.fn().mockResolvedValue(mockUpdatedDocument);

      // Create a caller with the manager context
      const caller = appRouter.createCaller(ctx);

      // Call the reviewKycDoc procedure
      const result = await caller.kycDocument.reviewKycDoc({
        id: testDocument.id,
        status: 'APPROVED',
        reviewerId: testUsers.manager.id,
      });

      // Verify the response
      expect(result.status).toBe('APPROVED');
      expect(result.reviewerId).toBe(testUsers.manager.id);
      expect(result.reviewedAt).toBeInstanceOf(Date);

      // Verify Prisma interactions
      expect(prisma.kycDocument.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: testDocument.id },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewerId: testUsers.manager.id,
          reviewedAt: expect.any(Date),
        }),
      }));
    });

    it('should reject when a non-manager/admin tries to review a document', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the reviewKycDoc procedure
      await expect(caller.kycDocument.reviewKycDoc({
        id: testDocument.id,
        status: 'APPROVED',
        reviewerId: testUsers.user.id,
      })).rejects.toThrow(/UNAUTHORIZED/);
    });

    it('should reject reviewing a document that has already been reviewed', async () => {
      // Mock context for a manager user
      const ctx = {
        userId: testUsers.manager.id,
        user: testUsers.manager,
        prisma,
      };

      // Mock the existing document as already reviewed
      prisma.kycDocument.findUnique = vi.fn().mockResolvedValue({
        ...testDocument,
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewerId: 'another-manager-id',
      });

      // Create a caller with the manager context
      const caller = appRouter.createCaller(ctx);

      // Call the reviewKycDoc procedure
      await expect(caller.kycDocument.reviewKycDoc({
        id: testDocument.id,
        status: 'REJECTED',
        reviewerId: testUsers.manager.id,
      })).rejects.toThrow(/This document has already been reviewed/);
    });
  });

  describe('getPendingKycDocs procedure', () => {
    it('should return pending documents for managers', async () => {
      // Mock context for a manager user
      const ctx = {
        userId: testUsers.manager.id,
        user: testUsers.manager,
        prisma,
      };

      // Mock document list response
      const mockDocuments = [
        {
          ...testDocument,
          user: {
            id: testUsers.user.id,
            name: 'Regular User',
            email: 'user@example.com',
          },
        }
      ];

      // Mock Prisma responses
      prisma.kycDocument.findMany = vi.fn().mockResolvedValue(mockDocuments);
      prisma.kycDocument.count = vi.fn().mockResolvedValue(1);

      // Create a caller with the manager context
      const caller = appRouter.createCaller(ctx);

      // Call the getPendingKycDocs procedure
      const result = await caller.kycDocument.getPendingKycDocs({});

      // Verify the response
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].status).toBe('PENDING');
      expect(result.pagination.total).toBe(1);

      // Verify Prisma interactions
      expect(prisma.kycDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'PENDING' },
      }));
    });

    it('should reject when a regular user tries to access pending documents', async () => {
      // Mock context for a regular user
      const ctx = {
        userId: testUsers.user.id,
        user: testUsers.user,
        prisma,
      };

      // Create a caller with the user context
      const caller = appRouter.createCaller(ctx);

      // Call the getPendingKycDocs procedure
      await expect(caller.kycDocument.getPendingKycDocs({})).rejects.toThrow(/UNAUTHORIZED/);
    });
  });
}); 