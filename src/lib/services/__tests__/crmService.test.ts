import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { 
  testCrmConnection, 
  fetchCrmAccounts, 
  getCrmConnectionStatus 
} from '../crmService';
import { prisma } from '@/lib/db';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    crmConnection: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('CRM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testCrmConnection', () => {
    it('should return true for successful connection', async () => {
      // Mock axios response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { success: true },
      });

      // Call the function
      const result = await testCrmConnection('test-api-key', 'test-domain.com');

      // Check result
      expect(result).toBe(true);

      // Verify axios was called with correct parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-domain.com/api/v1/ping',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should return false for failed connection', async () => {
      // Mock axios error
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection failed'));

      // Call the function
      const result = await testCrmConnection('test-api-key', 'test-domain.com');

      // Check result
      expect(result).toBe(false);
    });
  });

  describe('fetchCrmAccounts', () => {
    it('should fetch accounts from CRM', async () => {
      // Mock Prisma findUnique
      const mockConnection = {
        id: 'test-connection-id',
        clientId: 'test-client-id',
        apiKey: 'test-api-key',
        domain: 'test-domain.com',
        status: 'CONNECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(mockConnection);

      // Mock axios response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          accounts: [
            {
              id: 'account-1',
              name: 'Account 1',
              email: 'account1@example.com',
              phone: '123-456-7890',
              type: 'Customer',
            },
            {
              id: 'account-2',
              name: 'Account 2',
              email: 'account2@example.com',
              phone: null,
              type: null,
            },
          ],
        },
      });

      // Call the function
      const result = await fetchCrmAccounts('test-connection-id');

      // Check result
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'account-1',
        name: 'Account 1',
        email: 'account1@example.com',
        phone: '123-456-7890',
        type: 'Customer',
        source: 'crm',
      });
      expect(result[1]).toEqual({
        id: 'account-2',
        name: 'Account 2',
        email: 'account2@example.com',
        phone: null,
        type: null,
        source: 'crm',
      });

      // Verify Prisma and axios were called correctly
      expect(prisma.crmConnection.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-connection-id' },
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-domain.com/api/v1/accounts',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should throw error if connection not found', async () => {
      // Mock Prisma findUnique to return null
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(null);

      // Call the function and expect it to throw
      await expect(fetchCrmAccounts('nonexistent-id')).rejects.toThrow('CRM connection not found');
    });

    it('should throw error if connection is not active', async () => {
      // Mock Prisma findUnique for disconnected status
      const mockConnection = {
        id: 'test-connection-id',
        clientId: 'test-client-id',
        apiKey: 'test-api-key',
        domain: 'test-domain.com',
        status: 'FAILED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(mockConnection);

      // Call the function and expect it to throw
      await expect(fetchCrmAccounts('test-connection-id')).rejects.toThrow('CRM connection is not active');
    });
  });

  describe('getCrmConnectionStatus', () => {
    it('should return connected status when connection works', async () => {
      // Mock Prisma findUnique
      const mockConnection = {
        id: 'test-connection-id',
        clientId: 'test-client-id',
        apiKey: 'test-api-key',
        domain: 'test-domain.com',
        status: 'CONNECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(mockConnection);

      // Mock testCrmConnection to return true (by mocking axios)
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { success: true },
      });

      // Call the function
      const result = await getCrmConnectionStatus('test-connection-id');

      // Check result
      expect(result).toEqual({
        connected: true,
        connectionId: 'test-connection-id',
        domain: 'test-domain.com',
        lastSyncedAt: mockConnection.updatedAt,
      });
    });

    it('should update connection status if it changed', async () => {
      // Mock Prisma findUnique for pending status
      const mockConnection = {
        id: 'test-connection-id',
        clientId: 'test-client-id',
        apiKey: 'test-api-key',
        domain: 'test-domain.com',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(mockConnection);

      // Mock testCrmConnection to return true
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { success: true },
      });

      // Mock the Prisma update
      (prisma.crmConnection.update as any).mockResolvedValueOnce({
        ...mockConnection,
        status: 'CONNECTED',
      });

      // Call the function
      const result = await getCrmConnectionStatus('test-connection-id');

      // Check result
      expect(result.connected).toBe(true);

      // Verify Prisma update was called
      expect(prisma.crmConnection.update).toHaveBeenCalledWith({
        where: { id: 'test-connection-id' },
        data: { status: 'CONNECTED' },
      });
    });

    it('should return disconnected status and error when connection not found', async () => {
      // Mock Prisma findUnique to return null
      (prisma.crmConnection.findUnique as any).mockResolvedValueOnce(null);

      // Call the function
      const result = await getCrmConnectionStatus('nonexistent-id');

      // Check result
      expect(result).toEqual({
        connected: false,
        connectionId: 'nonexistent-id',
        domain: '',
        lastSyncedAt: null,
        error: 'CRM connection not found',
      });
    });
  });
}); 