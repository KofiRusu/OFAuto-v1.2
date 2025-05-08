import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, managerProcedure } from '@/lib/trpc/trpc';
import { UserRole } from '@prisma/client';
import { 
  CampaignIdeaRequestSchema,
  CampaignIdeaResponseSchema
} from '@/lib/schemas/campaignChatbot';
import { generateIdeas } from '@/lib/services/campaignChatbotService';
import { cache, invalidateCache } from '@/lib/services/cacheService';

export const campaignChatbotRouter = createTRPCRouter({
  /**
   * Generate campaign ideas based on provided context
   * Models have access to basic idea generation
   * Managers have access to more detailed ideas generation
   */
  generateCampaignIdeas: protectedProcedure
    .input(CampaignIdeaRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { auth, logger } = ctx;
      const isManagerOrAdmin = auth.userRole === UserRole.MANAGER || auth.userRole === UserRole.ADMIN;
      
      try {
        logger.info('Generating campaign ideas', { userId: auth.userId });
        
        // Create a cache key based on input and user role
        const cacheKey = `campaign:ideas:${auth.userId}:${JSON.stringify(input)}`;
        
        // Use cache utility with 5 minute TTL
        return await cache(
          cacheKey,
          async () => {
            // Generate ideas based on input context and optional parameters
            const ideas = await generateIdeas(
              input.context,
              input.platform,
              input.targetAudience,
              input.budget,
              input.goals
            );
            
            // If user is not a manager, limit the number of ideas returned
            // This encourages models to upgrade to manager features
            const limitedIdeas = isManagerOrAdmin ? ideas : ideas.slice(0, 3);
            
            return {
              ideas: limitedIdeas
            };
          },
          300 // 5 minute cache
        );
      } catch (error) {
        logger.error('Error generating campaign ideas', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate campaign ideas',
          cause: error,
        });
      }
    }),
    
  /**
   * Advanced campaign idea generation (Manager only)
   * This endpoint provides more detailed and targeted ideas
   * with additional features like competitor analysis
   */
  generateAdvancedCampaignIdeas: managerProcedure
    .input(CampaignIdeaRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { logger, auth } = ctx;
      
      try {
        logger.info('Generating advanced campaign ideas', { input });
        
        // Create a cache key based on input and user
        const cacheKey = `campaign:advanced:${auth.userId}:${JSON.stringify(input)}`;
        
        // Use cache utility with 5 minute TTL
        return await cache(
          cacheKey,
          async () => {
            // Generate basic ideas first
            const basicIdeas = await generateIdeas(
              input.context,
              input.platform,
              input.targetAudience,
              input.budget,
              input.goals
            );
            
            // Enhance the ideas with more manager-specific details
            // In a production environment, this would likely involve more 
            // complex AI prompts or additional API calls
            const enhancedIdeas = basicIdeas.map(idea => ({
              ...idea,
              description: `${idea.description}\n\nImplementation Strategy: Start with creating a content calendar for this campaign, planning out each post or content piece in advance. Measure engagement metrics to gauge performance and adjust strategy as needed.`
            }));
            
            // Add an extra "advanced" idea that's only available to managers
            enhancedIdeas.push({
              title: 'Growth Hacking Strategy',
              description: 'Implement a multi-platform approach that combines organic content with targeted paid promotion. Create a content flywheel where each platform feeds into the others, maximizing visibility and conversion opportunities across your entire online presence.'
            });
            
            return {
              ideas: enhancedIdeas
            };
          },
          300 // 5 minute cache
        );
      } catch (error) {
        logger.error('Error generating advanced campaign ideas', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate advanced campaign ideas',
          cause: error,
        });
      }
    })
}); 