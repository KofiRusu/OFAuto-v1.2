import { describe, it, expect, vi, beforeEach } from 'vitest';
import { campaignChatbotRouter } from '@/lib/trpc/routers/campaignChatbot';
import { UserRole } from '@prisma/client';
import * as campaignChatbotService from '@/lib/services/campaignChatbotService';

// Mock the campaign chatbot service
vi.mock('@/lib/services/campaignChatbotService', () => ({
  generateIdeas: vi.fn(),
}));

describe('Campaign Chatbot Router Integration Tests', () => {
  // Mock context
  const createMockContext = (role = UserRole.MODEL, userId = 'user123') => ({
    auth: {
      userId,
      userRole: role,
    },
    prisma: {
      chatbotAutomation: {
        create: vi.fn(),
        findMany: vi.fn(),
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

  describe('generateCampaignIdeas', () => {
    it('should generate campaign ideas for a model user (limited to 3)', async () => {
      const mockIdeas = [
        { title: 'Idea 1', description: 'Description 1' },
        { title: 'Idea 2', description: 'Description 2' },
        { title: 'Idea 3', description: 'Description 3' },
        { title: 'Idea 4', description: 'Description 4' },
        { title: 'Idea 5', description: 'Description 5' },
      ];

      (campaignChatbotService.generateIdeas as any).mockResolvedValueOnce(mockIdeas);

      const caller = campaignChatbotRouter.createCaller(mockCtx);
      const result = await caller.generateCampaignIdeas({
        context: 'I need ideas for my fitness content',
      });

      // Models should only get 3 ideas (limited version)
      expect(result.ideas.length).toBe(3);
      expect(result.ideas).toEqual(mockIdeas.slice(0, 3));
      expect(campaignChatbotService.generateIdeas).toHaveBeenCalledWith(
        'I need ideas for my fitness content',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should generate campaign ideas with all parameters for a manager user (full set)', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER, 'manager123');
      const mockIdeas = [
        { title: 'Idea 1', description: 'Description 1' },
        { title: 'Idea 2', description: 'Description 2' },
        { title: 'Idea 3', description: 'Description 3' },
        { title: 'Idea 4', description: 'Description 4' },
        { title: 'Idea 5', description: 'Description 5' },
      ];

      (campaignChatbotService.generateIdeas as any).mockResolvedValueOnce(mockIdeas);

      const caller = campaignChatbotRouter.createCaller(managerCtx);
      const result = await caller.generateCampaignIdeas({
        context: 'I need ideas for my fitness content',
        platform: 'Instagram',
        targetAudience: 'Fitness enthusiasts',
        budget: 500,
        goals: 'Increase engagement',
      });

      // Managers should get all ideas
      expect(result.ideas.length).toBe(5);
      expect(result.ideas).toEqual(mockIdeas);
      expect(campaignChatbotService.generateIdeas).toHaveBeenCalledWith(
        'I need ideas for my fitness content',
        'Instagram',
        'Fitness enthusiasts',
        500,
        'Increase engagement'
      );
    });

    it('should handle errors from the service', async () => {
      (campaignChatbotService.generateIdeas as any).mockRejectedValueOnce(new Error('Service error'));

      const caller = campaignChatbotRouter.createCaller(mockCtx);
      await expect(caller.generateCampaignIdeas({
        context: 'I need ideas for my fitness content',
      })).rejects.toThrow('Failed to generate campaign ideas');

      expect(mockCtx.logger.error).toHaveBeenCalled();
    });
  });

  describe('generateAdvancedCampaignIdeas', () => {
    it('should generate advanced campaign ideas for manager users', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER, 'manager123');
      const mockIdeas = [
        { title: 'Idea 1', description: 'Description 1' },
        { title: 'Idea 2', description: 'Description 2' },
        { title: 'Idea 3', description: 'Description 3' },
      ];

      (campaignChatbotService.generateIdeas as any).mockResolvedValueOnce(mockIdeas);

      const caller = campaignChatbotRouter.createCaller(managerCtx);
      const result = await caller.generateAdvancedCampaignIdeas({
        context: 'I need advanced ideas for my content',
      });

      // Should have mockIdeas + 1 additional idea (growth hacking)
      expect(result.ideas.length).toBe(4);
      // The first 3 ideas should be enhanced versions of the mock ideas
      expect(result.ideas[0].title).toBe('Idea 1');
      expect(result.ideas[0].description).toContain('Description 1');
      expect(result.ideas[0].description).toContain('Implementation Strategy');
      // The last idea should be the special "Growth Hacking Strategy"
      expect(result.ideas[3].title).toBe('Growth Hacking Strategy');

      expect(campaignChatbotService.generateIdeas).toHaveBeenCalledWith(
        'I need advanced ideas for my content',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should not be accessible to model users', async () => {
      const caller = campaignChatbotRouter.createCaller(mockCtx);
      await expect(caller.generateAdvancedCampaignIdeas({
        context: 'I need advanced ideas for my content',
      })).rejects.toThrow('FORBIDDEN');
    });

    it('should handle errors from the service', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER, 'manager123');
      (campaignChatbotService.generateIdeas as any).mockRejectedValueOnce(new Error('Service error'));

      const caller = campaignChatbotRouter.createCaller(managerCtx);
      await expect(caller.generateAdvancedCampaignIdeas({
        context: 'I need advanced ideas for my content',
      })).rejects.toThrow('Failed to generate advanced campaign ideas');

      expect(managerCtx.logger.error).toHaveBeenCalled();
    });
  });
}); 