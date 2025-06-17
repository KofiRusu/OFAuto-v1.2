import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContext } from '@/lib/test-utils/testContext';
import { prisma } from '@/lib/db';
import { organizationRouter } from '@/lib/trpc/routers/organization';
import { UserRole } from '@prisma/client';

vi.mock('@/lib/db', () => ({
  prisma: {
    client: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Organization Router', () => {
  const mockClient = {
    id: 'client-123',
    name: 'Test Client',
    email: 'test@example.com',
    phone: null,
    status: 'active',
    referralCode: 'TEST-ABC',
    orgSettings: {
      branding: {
        primaryColor: '#4f46e5',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrgSettings', () => {
    it('should return organization settings for a valid client', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);

      const result = await organizationRouter
        .createCaller(ctx)
        .getOrgSettings({ clientId: 'client-123' });

      expect(result).toEqual({
        clientId: 'client-123',
        settings: mockClient.orgSettings,
      });
    });

    it('should throw error if client not found', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(null);

      await expect(
        organizationRouter.createCaller(ctx).getOrgSettings({ clientId: 'client-123' })
      ).rejects.toThrow('Client not found');
    });

    it('should deny access for non-manager users', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.USER },
      });

      await expect(
        organizationRouter.createCaller(ctx).getOrgSettings({ clientId: 'client-123' })
      ).rejects.toThrow('Only managers and administrators can access this resource');
    });
  });

  describe('updateOrgSettings', () => {
    it('should update organization settings successfully', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      const newSettings = {
        displayName: 'Updated Org',
        primaryColor: '#123456',
      };

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...mockClient,
        orgSettings: newSettings,
      });

      const result = await organizationRouter
        .createCaller(ctx)
        .updateOrgSettings({ clientId: 'client-123', settings: newSettings });

      expect(result).toEqual({
        clientId: 'client-123',
        settings: newSettings,
      });

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        data: { orgSettings: newSettings },
        select: { id: true, orgSettings: true },
      });
    });
  });

  describe('updateReferralCode', () => {
    it('should update referral code successfully', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...mockClient,
        referralCode: 'NEW-CODE',
      });

      const result = await organizationRouter
        .createCaller(ctx)
        .updateReferralCode({ clientId: 'client-123', referralCode: 'NEW-CODE' });

      expect(result).toEqual({
        clientId: 'client-123',
        referralCode: 'NEW-CODE',
      });
    });

    it('should allow setting referral code to null', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...mockClient,
        referralCode: null,
      });

      const result = await organizationRouter
        .createCaller(ctx)
        .updateReferralCode({ clientId: 'client-123', referralCode: null });

      expect(result).toEqual({
        clientId: 'client-123',
        referralCode: null,
      });
    });
  });

  describe('generateReferralCode', () => {
    it('should generate a unique referral code', async () => {
      const ctx = createTestContext({
        user: { id: 'user-123', role: UserRole.MANAGER },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...mockClient,
        referralCode: 'TES-ABCDE',
      });

      const result = await organizationRouter
        .createCaller(ctx)
        .generateReferralCode({ clientId: 'client-123' });

      expect(result.clientId).toBe('client-123');
      expect(result.referralCode).toMatch(/^[A-Z]{3}-[A-Z0-9]{5}$/);
    });
  });

  describe('Access Control', () => {
    it('should allow ADMIN users to access all endpoints', async () => {
      const ctx = createTestContext({
        user: { id: 'admin-123', role: UserRole.ADMIN },
      });

      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(mockClient);

      const result = await organizationRouter
        .createCaller(ctx)
        .getOrgSettings({ clientId: 'client-123' });

      expect(result.clientId).toBe('client-123');
    });

    it('should deny access for MODEL users', async () => {
      const ctx = createTestContext({
        user: { id: 'model-123', role: UserRole.MODEL },
      });

      await expect(
        organizationRouter.createCaller(ctx).getOrgSettings({ clientId: 'client-123' })
      ).rejects.toThrow('Only managers and administrators can access this resource');
    });
  });
}); 