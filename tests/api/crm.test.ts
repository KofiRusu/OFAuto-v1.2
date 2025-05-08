import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { appRouter } from '@/lib/trpc/router';
import { createInnerTRPCContext } from '@/lib/trpc/context';
import { prisma } from '@/lib/db';

// Mock the CRM service functions
vi.mock('@/lib/services/crmService', () => ({
  testCrmConnection: vi.fn().mockResolvedValue(true),
  fetchCrmAccounts: vi.fn().mockResolvedValue([
    {
      id: 'account-1',
      name: 'Test Account 1',
      email: 'account1@example.com',
      phone: '123-456-7890',
      type: 'Customer',
      source: 'crm',
    },
    {
      id: 'account-2',
      name: 'Test Account 2',
      email: 'account2@example.com',
      phone: null,
      type: null,
      source: 'crm',
    },
  ]),
  getCrmConnectionStatus: vi.fn().mockResolvedValue({
    connected: true,
    connectionId: 'test-connection-id',
    domain: 'test-domain.com',
    lastSyncedAt: new Date(),
  }),
}));

describe('CRM API Integration', () => {
  // Test data
  let userId: string;
  let clientId: string;
  let connectionId: string;

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'crm-test@example.com',
        name: 'CRM Test User',
        clerkId: `user_${Math.random().toString(36).substring(2, 9)}`,
        role: 'MANAGER',
      },
    });
    userId = user.id;

    // Create test client
    const client = await prisma.client.create({
      data: {
        name: 'CRM Test Client',
        email: 'client-test@example.com',
        userId: user.id
      },
    });
    clientId = client.id;

    // Create CRM connection
    const connection = await prisma.crmConnection.create({
      data: {
        clientId: client.id,
        apiKey: 'test-api-key',
        domain: 'test-domain.com',
        status: 'CONNECTED',
      },
    });
    connectionId = connection.id;
  });

  // Clean up test data
  afterAll(async () => {
    // Delete test data in reverse order
    await prisma.crmConnection.deleteMany({
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

  describe('connectCrm', () => {
    it('should connect client to CRM', async () => {
      const caller = createCaller();
      
      const result = await caller.crm.connectCrm({
        clientId,
        apiKey: 'new-api-key',
        domain: 'new-domain.com',
      });

      expect(result.success).toBe(true);
      expect(result.connection).toBeDefined();
      expect(result.connection.status).toBe('CONNECTED');
      expect(result.connection.clientId).toBe(clientId);
      expect(result.message).toBe('CRM connected successfully');
    });

    it('should reject if client not found', async () => {
      const caller = createCaller();
      
      await expect(
        caller.crm.connectCrm({
          clientId: 'nonexistent-client-id',
          apiKey: 'test-api-key',
          domain: 'test-domain.com',
        })
      ).rejects.toThrow('Client not found');
    });
  });

  describe('getCrmStatus', () => {
    it('should return connection status', async () => {
      const caller = createCaller();
      
      const result = await caller.crm.getCrmStatus({
        connectionId,
      });

      expect(result.connected).toBe(true);
      expect(result.domain).toBe('test-domain.com');
      expect(result.connectionId).toBe(connectionId);
      expect(result.lastSyncedAt).toBeDefined();
    });

    it('should reject if connection not found', async () => {
      const caller = createCaller();
      
      await expect(
        caller.crm.getCrmStatus({
          connectionId: 'nonexistent-connection-id',
        })
      ).rejects.toThrow('CRM connection not found');
    });
  });

  describe('listCrmAccounts', () => {
    it('should return accounts from CRM', async () => {
      const caller = createCaller();
      
      const result = await caller.crm.listCrmAccounts({
        connectionId,
      });

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].name).toBe('Test Account 1');
      expect(result.accounts[1].name).toBe('Test Account 2');
      expect(result.count).toBe(2);
    });

    it('should reject if connection not found', async () => {
      const caller = createCaller();
      
      await expect(
        caller.crm.listCrmAccounts({
          connectionId: 'nonexistent-connection-id',
        })
      ).rejects.toThrow('CRM connection not found');
    });
  });
}); 