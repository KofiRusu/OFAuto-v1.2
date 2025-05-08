import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  KpiCreateSchema, 
  KpiUpdateSchema, 
  KpiResponseSchema, 
  KpiListSchema, 
  KpiDeleteSchema 
} from '@/lib/schemas/kpi';
import { kpiRouter } from '@/lib/trpc/routers/kpi';
import { UserRole } from '@prisma/client';

describe('KPI Router Integration Tests', () => {
  // Mock context
  const createMockContext = (role = UserRole.MANAGER) => ({
    auth: {
      userId: 'manager123',
      userRole: role,
    },
    prisma: {
      kPI: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  });

  let mockCtx;

  beforeEach(() => {
    mockCtx = createMockContext();
    vi.clearAllMocks();
  });

  describe('createKpi', () => {
    it('should successfully create a KPI as a manager', async () => {
      const mockInput = {
        userId: 'user123',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        dueDate: new Date('2024-12-31'),
      };

      const mockCreatedKpi = {
        id: 'kpi123',
        userId: 'user123',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        currentValue: 0,
        dueDate: new Date('2024-12-31'),
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.kPI.create.mockResolvedValueOnce(mockCreatedKpi);

      const caller = kpiRouter.createCaller(mockCtx);
      const result = await caller.createKpi(mockInput);

      expect(result).toEqual(mockCreatedKpi);
      expect(mockCtx.prisma.kPI.create).toHaveBeenCalledWith({
        data: {
          userId: mockInput.userId,
          name: mockInput.name,
          targetValue: mockInput.targetValue,
          dueDate: mockInput.dueDate,
        },
      });
    });

    it('should require manager or admin role', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      const caller = kpiRouter.createCaller(modelCtx);

      await expect(caller.createKpi({
        userId: 'user123',
        name: 'Monthly Subscribers',
        targetValue: 1000,
      })).rejects.toThrow('FORBIDDEN');
    });

    it('should handle database errors', async () => {
      mockCtx.prisma.kPI.create.mockRejectedValueOnce(
        new Error('Database error')
      );

      const caller = kpiRouter.createCaller(mockCtx);
      await expect(caller.createKpi({
        userId: 'user123',
        name: 'Monthly Subscribers',
        targetValue: 1000,
      })).rejects.toThrow('Failed to create KPI');
    });
  });

  describe('listKpis', () => {
    it('should list KPIs with no filters as a manager', async () => {
      const mockKpis = [
        {
          id: 'kpi1',
          userId: 'user1',
          name: 'KPI 1',
          targetValue: 1000,
          currentValue: 200,
          dueDate: new Date('2024-12-31'),
          status: 'IN_PROGRESS',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: 'User One',
            email: 'user1@example.com',
          },
        },
        {
          id: 'kpi2',
          userId: 'user2',
          name: 'KPI 2',
          targetValue: 500,
          currentValue: 500,
          dueDate: null,
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: 'User Two',
            email: 'user2@example.com',
          },
        },
      ];

      mockCtx.prisma.kPI.findMany.mockResolvedValueOnce(mockKpis);

      const caller = kpiRouter.createCaller(mockCtx);
      const result = await caller.listKpis();

      expect(result).toEqual(mockKpis);
      expect(mockCtx.prisma.kPI.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should filter KPIs by userId and status', async () => {
      mockCtx.prisma.kPI.findMany.mockResolvedValueOnce([]);

      const caller = kpiRouter.createCaller(mockCtx);
      await caller.listKpis({
        userId: 'user123',
        status: 'IN_PROGRESS',
      });

      expect(mockCtx.prisma.kPI.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'IN_PROGRESS',
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should restrict model users to only see their own KPIs', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      modelCtx.auth.userId = 'model123';
      
      mockCtx.prisma.kPI.findMany.mockResolvedValueOnce([]);

      const caller = kpiRouter.createCaller(modelCtx);
      await caller.listKpis();

      expect(mockCtx.prisma.kPI.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'model123',
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('updateKpi', () => {
    const mockKpi = {
      id: 'kpi123',
      userId: 'user123',
      name: 'Monthly Subscribers',
      targetValue: 1000,
      currentValue: 200,
      dueDate: new Date('2024-12-31'),
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update a KPI with partial data', async () => {
      mockCtx.prisma.kPI.findUnique.mockResolvedValueOnce(mockKpi);
      
      const updatedKpi = {
        ...mockKpi,
        currentValue: 500,
        status: 'COMPLETED',
        updatedAt: new Date(),
      };
      
      mockCtx.prisma.kPI.update.mockResolvedValueOnce(updatedKpi);

      const caller = kpiRouter.createCaller(mockCtx);
      const result = await caller.updateKpi({
        id: 'kpi123',
        currentValue: 500,
      });

      expect(result).toEqual(updatedKpi);
      expect(mockCtx.prisma.kPI.update).toHaveBeenCalledWith({
        where: { id: 'kpi123' },
        data: {
          currentValue: 500,
          status: 'COMPLETED', // Auto-updated because currentValue >= targetValue
        },
      });
    });

    it('should auto-update status when current value reaches target', async () => {
      mockCtx.prisma.kPI.findUnique.mockResolvedValueOnce(mockKpi);
      
      const updatedKpi = {
        ...mockKpi,
        currentValue: 1000,
        status: 'COMPLETED',
        updatedAt: new Date(),
      };
      
      mockCtx.prisma.kPI.update.mockResolvedValueOnce(updatedKpi);

      const caller = kpiRouter.createCaller(mockCtx);
      await caller.updateKpi({
        id: 'kpi123',
        currentValue: 1000,
      });

      expect(mockCtx.prisma.kPI.update).toHaveBeenCalledWith({
        where: { id: 'kpi123' },
        data: {
          currentValue: 1000,
          status: 'COMPLETED',
        },
      });
    });

    it('should allow model user to update their own KPI', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      modelCtx.auth.userId = 'user123'; // Same as the mockKpi.userId
      
      modelCtx.prisma.kPI.findUnique.mockResolvedValueOnce(mockKpi);
      modelCtx.prisma.kPI.update.mockResolvedValueOnce({
        ...mockKpi,
        currentValue: 300,
        updatedAt: new Date(),
      });

      const caller = kpiRouter.createCaller(modelCtx);
      await caller.updateKpi({
        id: 'kpi123',
        currentValue: 300,
      });

      expect(modelCtx.prisma.kPI.update).toHaveBeenCalled();
    });

    it('should prevent model user from updating other users\' KPIs', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      modelCtx.auth.userId = 'different-user'; // Different from mockKpi.userId
      
      modelCtx.prisma.kPI.findUnique.mockResolvedValueOnce(mockKpi);

      const caller = kpiRouter.createCaller(modelCtx);
      await expect(caller.updateKpi({
        id: 'kpi123',
        currentValue: 300,
      })).rejects.toThrow('You do not have permission to update this KPI');
    });

    it('should handle non-existent KPI', async () => {
      mockCtx.prisma.kPI.findUnique.mockResolvedValueOnce(null);

      const caller = kpiRouter.createCaller(mockCtx);
      await expect(caller.updateKpi({
        id: 'nonexistent',
        currentValue: 300,
      })).rejects.toThrow('KPI not found');
    });
  });

  describe('deleteKpi', () => {
    it('should delete a KPI as a manager', async () => {
      mockCtx.prisma.kPI.findUnique.mockResolvedValueOnce({
        id: 'kpi123',
        userId: 'user123',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        currentValue: 200,
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      mockCtx.prisma.kPI.delete.mockResolvedValueOnce(true);

      const caller = kpiRouter.createCaller(mockCtx);
      const result = await caller.deleteKpi({ id: 'kpi123' });

      expect(result).toBe(true);
      expect(mockCtx.prisma.kPI.delete).toHaveBeenCalledWith({
        where: { id: 'kpi123' },
      });
    });

    it('should require manager or admin role', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      const caller = kpiRouter.createCaller(modelCtx);

      await expect(caller.deleteKpi({
        id: 'kpi123',
      })).rejects.toThrow('FORBIDDEN');
    });

    it('should handle non-existent KPI', async () => {
      mockCtx.prisma.kPI.findUnique.mockResolvedValueOnce(null);

      const caller = kpiRouter.createCaller(mockCtx);
      await expect(caller.deleteKpi({
        id: 'nonexistent',
      })).rejects.toThrow('KPI not found');
    });
  });
}); 