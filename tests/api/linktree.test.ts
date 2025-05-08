import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinktreeConfigSchema, LinktreeUpdateSchema } from '@/lib/schemas/linktree';
import { linktreeRouter } from '@/lib/trpc/routers/linktree';
import { UserRole } from '@prisma/client';
import * as linktreeService from '@/lib/services/linktreeService';

// Mock the linktree service
vi.mock('@/lib/services/linktreeService', () => ({
  suggestLinktreeConfig: vi.fn(),
}));

describe('Linktree Router Integration Tests', () => {
  // Mock context
  const createMockContext = (role = UserRole.MODEL, userId = 'user123') => ({
    auth: {
      userId,
      userRole: role,
    },
    prisma: {
      linktreeConfig: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
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

  describe('getLinktreeConfig', () => {
    it('should return the user\'s linktree config', async () => {
      const mockLinktreeConfig = {
        id: 'linktree123',
        userId: 'user123',
        links: [
          { title: 'My Instagram', url: 'https://instagram.com/user123' },
        ],
        theme: 'dark',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.linktreeConfig.findUnique.mockResolvedValueOnce(mockLinktreeConfig);

      const caller = linktreeRouter.createCaller(mockCtx);
      const result = await caller.getLinktreeConfig();

      expect(result).toEqual(mockLinktreeConfig);
      expect(mockCtx.prisma.linktreeConfig.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
      });
    });

    it('should return null if the user has no linktree config', async () => {
      mockCtx.prisma.linktreeConfig.findUnique.mockResolvedValueOnce(null);

      const caller = linktreeRouter.createCaller(mockCtx);
      const result = await caller.getLinktreeConfig();

      expect(result).toBeNull();
    });

    it('should allow manager to get another user\'s linktree config', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER, 'manager123');
      const mockLinktreeConfig = {
        id: 'linktree123',
        userId: 'user123',
        links: [],
        theme: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      managerCtx.prisma.linktreeConfig.findUnique.mockResolvedValueOnce(mockLinktreeConfig);

      const caller = linktreeRouter.createCaller(managerCtx);
      const result = await caller.getLinktreeConfig({ userId: 'user123' });

      expect(result).toEqual(mockLinktreeConfig);
      expect(managerCtx.prisma.linktreeConfig.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
      });
    });

    it('should not allow model to get another user\'s linktree config', async () => {
      const caller = linktreeRouter.createCaller(mockCtx);

      await expect(caller.getLinktreeConfig({ userId: 'other-user' }))
        .rejects.toThrow('You do not have permission to view this user\'s Linktree');
    });
  });

  describe('updateLinktreeConfig', () => {
    it('should create a new linktree config if one does not exist', async () => {
      const mockInput = {
        links: [
          { title: 'My Instagram', url: 'https://instagram.com/user123' },
        ],
        theme: 'dark',
      };

      const mockCreatedConfig = {
        id: 'linktree123',
        userId: 'user123',
        ...mockInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.prisma.linktreeConfig.findUnique.mockResolvedValueOnce(null);
      mockCtx.prisma.linktreeConfig.create.mockResolvedValueOnce(mockCreatedConfig);

      const caller = linktreeRouter.createCaller(mockCtx);
      const result = await caller.updateLinktreeConfig(mockInput);

      expect(result).toEqual(mockCreatedConfig);
      expect(mockCtx.prisma.linktreeConfig.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          links: mockInput.links,
          theme: mockInput.theme,
        },
      });
    });

    it('should update an existing linktree config', async () => {
      const existingConfig = {
        id: 'linktree123',
        userId: 'user123',
        links: [
          { title: 'Old Link', url: 'https://example.com/old' },
        ],
        theme: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInput = {
        links: [
          { title: 'My Instagram', url: 'https://instagram.com/user123' },
          { title: 'My Twitter', url: 'https://twitter.com/user123' },
        ],
        theme: 'dark',
      };

      const mockUpdatedConfig = {
        ...existingConfig,
        links: mockInput.links,
        theme: mockInput.theme,
        updatedAt: new Date(),
      };

      mockCtx.prisma.linktreeConfig.findUnique.mockResolvedValueOnce(existingConfig);
      mockCtx.prisma.linktreeConfig.update.mockResolvedValueOnce(mockUpdatedConfig);

      const caller = linktreeRouter.createCaller(mockCtx);
      const result = await caller.updateLinktreeConfig(mockInput);

      expect(result).toEqual(mockUpdatedConfig);
      expect(mockCtx.prisma.linktreeConfig.update).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        data: {
          links: mockInput.links,
          theme: mockInput.theme,
        },
      });
    });

    it('should handle database errors', async () => {
      mockCtx.prisma.linktreeConfig.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const caller = linktreeRouter.createCaller(mockCtx);
      await expect(caller.updateLinktreeConfig({
        links: [],
      })).rejects.toThrow('Failed to update Linktree configuration');
    });
  });

  describe('generateLinktreeSuggestions', () => {
    it('should generate suggestions for the current user', async () => {
      const mockSuggestions = [
        { title: 'My Instagram', url: 'https://instagram.com/user123' },
        { title: 'My OnlyFans', url: 'https://onlyfans.com/user123' },
      ];

      (linktreeService.suggestLinktreeConfig as any).mockResolvedValueOnce(mockSuggestions);

      const caller = linktreeRouter.createCaller(mockCtx);
      const result = await caller.generateLinktreeSuggestions({ userId: 'user123' });

      expect(result).toEqual({ suggestions: mockSuggestions });
      expect(linktreeService.suggestLinktreeConfig).toHaveBeenCalledWith('user123');
    });

    it('should allow manager to generate suggestions for any user', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER, 'manager123');
      const mockSuggestions = [
        { title: 'My Instagram', url: 'https://instagram.com/user123' },
      ];

      (linktreeService.suggestLinktreeConfig as any).mockResolvedValueOnce(mockSuggestions);

      const caller = linktreeRouter.createCaller(managerCtx);
      const result = await caller.generateLinktreeSuggestions({ userId: 'user123' });

      expect(result).toEqual({ suggestions: mockSuggestions });
      expect(linktreeService.suggestLinktreeConfig).toHaveBeenCalledWith('user123');
    });

    it('should not allow model to generate suggestions for another user', async () => {
      const caller = linktreeRouter.createCaller(mockCtx);

      await expect(caller.generateLinktreeSuggestions({ userId: 'other-user' }))
        .rejects.toThrow('You do not have permission to generate suggestions for this user');
    });

    it('should handle service errors', async () => {
      (linktreeService.suggestLinktreeConfig as any).mockRejectedValueOnce(new Error('Service error'));

      const caller = linktreeRouter.createCaller(mockCtx);
      await expect(caller.generateLinktreeSuggestions({ userId: 'user123' }))
        .rejects.toThrow('Failed to generate Linktree suggestions');
    });
  });
}); 