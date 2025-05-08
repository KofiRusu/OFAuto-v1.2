import { TRPCError } from '@trpc/server';
import { createTRPCRouter } from '@/lib/trpc/trpc';
import { organizationRouter } from '@/lib/trpc/routers/organization';
import { organizationService } from '@/lib/services/organizationService';
import { UserRole } from '@prisma/client';
import { DEFAULT_ORG_SETTINGS } from '@/lib/schemas/organization';

// Mock dependencies
jest.mock('@/lib/services/organizationService', () => ({
  organizationService: {
    createReferralCode: jest.fn(),
    mergeWithDefaultSettings: jest.fn(),
    validateReferralCode: jest.fn(),
  },
}));

// Create a test context
const createMockContext = ({ userRole = UserRole.ADMIN, userId = 'user-123' } = {}) => ({
  auth: {
    userId,
    userRole,
  },
  prisma: {
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
});

describe('Organization Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getOrgSettings', () => {
    it('should return client settings when user is admin', async () => {
      // Mock context
      const ctx = createMockContext();
      
      // Mock prisma client findUnique
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'client-123',
          name: 'Test Client',
          orgSettings: { customSetting: true },
        }),
      };
      
      // Mock organizationService.mergeWithDefaultSettings
      (organizationService.mergeWithDefaultSettings as jest.Mock).mockReturnValue({
        ...DEFAULT_ORG_SETTINGS,
        customSetting: true,
      });
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.getOrgSettings({
        clientId: 'client-123',
      });
      
      expect(result).toEqual({
        clientId: 'client-123',
        settings: {
          ...DEFAULT_ORG_SETTINGS,
          customSetting: true,
        },
      });
      
      // Admin can access any client
      expect(ctx.prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        select: { id: true, name: true, orgSettings: true },
      });
    });
    
    it('should return client settings when user is manager with access', async () => {
      // Mock context with manager role
      const ctx = createMockContext({ userRole: UserRole.MANAGER });
      
      // Mock prisma client findUnique
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'client-123',
          name: 'Test Client',
          orgSettings: null,
        }),
      };
      
      // Mock organizationService.mergeWithDefaultSettings
      (organizationService.mergeWithDefaultSettings as jest.Mock).mockReturnValue(DEFAULT_ORG_SETTINGS);
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.getOrgSettings({
        clientId: 'client-123',
      });
      
      expect(result).toEqual({
        clientId: 'client-123',
        settings: DEFAULT_ORG_SETTINGS,
      });
      
      // Manager can only access their own clients
      expect(ctx.prisma.client.findUnique).toHaveBeenCalledWith({
        where: { 
          id: 'client-123',
          userId: 'user-123',
        },
        select: { id: true, name: true, orgSettings: true },
      });
    });
    
    it('should throw error when client not found', async () => {
      // Mock context
      const ctx = createMockContext();
      
      // Mock prisma client findUnique returns null (client not found)
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue(null),
      };
      
      const caller = organizationRouter.createCaller(ctx);
      
      await expect(caller.getOrgSettings({
        clientId: 'non-existent',
      })).rejects.toThrow(TRPCError);
    });
  });
  
  describe('updateOrgSettings', () => {
    it('should update client settings', async () => {
      // Mock context
      const ctx = createMockContext();
      
      // Mock prisma client findUnique and update
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue({ id: 'client-123' }),
        update: jest.fn().mockResolvedValue({
          id: 'client-123',
          name: 'Test Client',
          orgSettings: { updatedSetting: true },
        }),
      };
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.updateOrgSettings({
        clientId: 'client-123',
        settings: { updatedSetting: true },
      });
      
      expect(result).toEqual({
        clientId: 'client-123',
        settings: { updatedSetting: true },
      });
      
      expect(ctx.prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-123' },
        data: { orgSettings: { updatedSetting: true } },
        select: { id: true, name: true, orgSettings: true },
      });
    });
  });
  
  describe('generateReferralCode', () => {
    it('should generate and return a referral code', async () => {
      // Mock context
      const ctx = createMockContext();
      
      // Mock prisma client findUnique
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue({ id: 'client-123' }),
      };
      
      // Mock organizationService.createReferralCode
      (organizationService.createReferralCode as jest.Mock).mockResolvedValue('TEST-ABC123');
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.generateReferralCode({
        clientId: 'client-123',
      });
      
      expect(result).toEqual({
        clientId: 'client-123',
        referralCode: 'TEST-ABC123',
      });
      
      expect(organizationService.createReferralCode).toHaveBeenCalledWith('client-123', ctx.prisma);
    });
    
    it('should throw error when service fails', async () => {
      // Mock context
      const ctx = createMockContext();
      
      // Mock prisma client findUnique
      ctx.prisma.client = {
        findUnique: jest.fn().mockResolvedValue({ id: 'client-123' }),
      };
      
      // Mock organizationService.createReferralCode to throw error
      (organizationService.createReferralCode as jest.Mock).mockRejectedValue(new Error('Service error'));
      
      const caller = organizationRouter.createCaller(ctx);
      
      await expect(caller.generateReferralCode({
        clientId: 'client-123',
      })).rejects.toThrow(TRPCError);
      
      expect(ctx.logger.error).toHaveBeenCalled();
    });
  });
  
  describe('getAllClientsWithOrgData', () => {
    it('should return all clients for admin user', async () => {
      // Mock context with admin role
      const ctx = createMockContext();
      
      // Mock prisma client findMany
      ctx.prisma.client = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'client-1', name: 'Client 1' },
          { id: 'client-2', name: 'Client 2' },
        ]),
      };
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.getAllClientsWithOrgData();
      
      expect(result).toEqual([
        { id: 'client-1', name: 'Client 1' },
        { id: 'client-2', name: 'Client 2' },
      ]);
      
      // Admin gets all clients (no where filter)
      expect(ctx.prisma.client.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
    });
    
    it('should return only user clients for manager role', async () => {
      // Mock context with manager role
      const ctx = createMockContext({ userRole: UserRole.MANAGER });
      
      // Mock prisma client findMany
      ctx.prisma.client = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'client-1', name: 'Client 1' },
        ]),
      };
      
      const caller = organizationRouter.createCaller(ctx);
      
      const result = await caller.getAllClientsWithOrgData();
      
      expect(result).toEqual([
        { id: 'client-1', name: 'Client 1' },
      ]);
      
      // Manager only gets their clients
      expect(ctx.prisma.client.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { name: 'asc' },
      });
    });
  });
}); 