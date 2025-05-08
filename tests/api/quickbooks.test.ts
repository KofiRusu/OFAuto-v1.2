import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { appRouter } from '@/lib/trpc/router';
import { createInnerTRPCContext } from '@/lib/trpc/context';
import { prisma } from '@/lib/db';

// Mock the quickBooksService
vi.mock('@/lib/services/quickBooksService', () => ({
  exchangeOAuthCode: vi.fn().mockResolvedValue({ 
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer'
  }),
  refreshAccessToken: vi.fn().mockResolvedValue({
    access_token: 'mock-new-access-token',
    refresh_token: 'mock-new-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer'
  }),
  getConnectionStatus: vi.fn().mockResolvedValue('CONNECTED'),
  getAuthorizationUrl: vi.fn().mockReturnValue('https://mock-auth-url')
}));

describe('QuickBooks API Integration', () => {
  // Test data
  let userId: string;
  let clientId: string;
  let connectionId: string;

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'quickbooks-test@example.com',
        name: 'QuickBooks Test User',
        clerkId: `user_${Math.random().toString(36).substring(2, 9)}`,
        role: 'MANAGER',
      },
    });
    userId = user.id;

    // Create test client
    const client = await prisma.client.create({
      data: {
        name: 'QuickBooks Test Client',
        email: 'client-test@example.com',
        userId: user.id
      },
    });
    clientId = client.id;

    // Create QuickBooks connection
    const connection = await prisma.quickBooksConnection.create({
      data: {
        clientId: client.id,
        realmId: 'test-realm-id',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        status: 'PENDING',
      },
    });
    connectionId = connection.id;
  });

  // Clean up test data
  afterAll(async () => {
    // Delete test data in reverse order
    await prisma.quickBooksConnection.deleteMany({
      where: { clientId },
    });
    await prisma.client.delete({
      where: { id: clientId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
  });

  // Create a caller with the correct context
  const createCaller = () => {
    const ctx = createInnerTRPCContext({
      userId,
      user: {
        id: userId,
        role: 'MANAGER',
      },
      logger: console,
    });
    return appRouter.createCaller(ctx);
  };

  describe('connectQuickBooks', () => {
    it('should connect a client to QuickBooks', async () => {
      const caller = createCaller();
      
      const result = await caller.quickBooks.connectQuickBooks({
        clientId,
        realmId: 'new-realm-id',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      expect(result.success).toBe(true);
      expect(result.connection).toBeDefined();
      expect(result.connection.status).toBe('CONNECTED');
      expect(result.connection.clientId).toBe(clientId);
    });
  });

  describe('refreshQuickBooksToken', () => {
    it('should refresh QuickBooks tokens', async () => {
      const caller = createCaller();
      
      const result = await caller.quickBooks.refreshQuickBooksToken({
        refreshToken: 'test-refresh-token',
      });

      expect(result.success).toBe(true);
      expect(result.connection).toBeDefined();
      expect(result.connection.status).toBe('CONNECTED');
      expect(result.connection.clientId).toBe(clientId);
    });
  });

  describe('getQuickBooksStatus', () => {
    it('should get QuickBooks connection status', async () => {
      const caller = createCaller();
      
      const result = await caller.quickBooks.getQuickBooksStatus({
        clientId,
      });

      expect(result.status).toBe('CONNECTED');
      expect(result.connectedAt).toBeDefined();
    });
  });
}); 