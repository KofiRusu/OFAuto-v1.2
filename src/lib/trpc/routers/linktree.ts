import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { UserRole } from '@prisma/client';
import {
  LinktreeConfigSchema,
  LinktreeUpdateSchema,
  GenerateSuggestionsSchema,
} from '@/lib/schemas/linktree';
import { suggestLinktreeConfig } from '@/lib/services/linktreeService';

export const linktreeRouter = createTRPCRouter({
  /**
   * Get Linktree configuration for a user
   * Users can only see their own config
   * Managers/Admins can see any user's config
   */
  getLinktreeConfig: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      const isManager = auth.userRole === UserRole.MANAGER || auth.userRole === UserRole.ADMIN;
      
      try {
        // Determine which user's linktree to fetch
        const targetUserId = input?.userId || auth.userId;
        
        // Only managers/admins can view other users' linktrees
        if (!isManager && targetUserId !== auth.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this user\'s Linktree',
          });
        }
        
        // Get linktree config
        const linktreeConfig = await prisma.linktreeConfig.findUnique({
          where: { userId: targetUserId },
        });
        
        if (!linktreeConfig) {
          // Return null if no config exists yet
          return null;
        }
        
        return linktreeConfig;
      } catch (error) {
        logger.error('Error fetching Linktree config', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Linktree configuration',
          cause: error,
        });
      }
    }),
  
  /**
   * Update Linktree configuration
   * Users can only update their own config
   */
  updateLinktreeConfig: protectedProcedure
    .input(LinktreeUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      
      try {
        logger.info('Updating Linktree config', { userId: auth.userId });
        
        // Check if config already exists
        const existingConfig = await prisma.linktreeConfig.findUnique({
          where: { userId: auth.userId },
        });
        
        if (existingConfig) {
          // Update existing config
          const updatedConfig = await prisma.linktreeConfig.update({
            where: { userId: auth.userId },
            data: {
              links: input.links,
              theme: input.theme,
            },
          });
          
          return updatedConfig;
        } else {
          // Create new config
          const newConfig = await prisma.linktreeConfig.create({
            data: {
              userId: auth.userId,
              links: input.links,
              theme: input.theme,
            },
          });
          
          return newConfig;
        }
      } catch (error) {
        logger.error('Error updating Linktree config', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update Linktree configuration',
          cause: error,
        });
      }
    }),
  
  /**
   * Generate Linktree suggestions based on user data
   * Managers can generate for any user, models only for themselves
   */
  generateLinktreeSuggestions: protectedProcedure
    .input(GenerateSuggestionsSchema)
    .mutation(async ({ ctx, input }) => {
      const { auth, logger } = ctx;
      const isManager = auth.userRole === UserRole.MANAGER || auth.userRole === UserRole.ADMIN;
      
      try {
        // Only managers/admins can generate suggestions for other users
        if (!isManager && input.userId !== auth.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to generate suggestions for this user',
          });
        }
        
        // Generate suggestions using service
        const suggestions = await suggestLinktreeConfig(input.userId);
        
        return { suggestions };
      } catch (error) {
        logger.error('Error generating Linktree suggestions', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate Linktree suggestions',
          cause: error,
        });
      }
    }),
}); 