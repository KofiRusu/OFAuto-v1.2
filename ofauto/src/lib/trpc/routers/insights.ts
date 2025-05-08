'use server';

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '@/lib/trpc/trpc';
import { ReasoningService, InsightType, CampaignVariant } from '@/lib/services/reasoningService';
import { verifyClientOwnership } from '@/lib/auth/verifyClientOwnership';
import { logger } from '@/lib/logger';

// Convert InsightType enum to string literal union type for zod
const insightTypeSchema = z.enum([
  InsightType.CONTENT_STRATEGY,
  InsightType.PRICING_OPTIMIZATION,
  InsightType.POSTING_SCHEDULE,
  InsightType.PLATFORM_STRATEGY,
  InsightType.ENGAGEMENT_TACTICS,
  InsightType.REVENUE_GROWTH,
  InsightType.AB_TESTING,
  InsightType.PERSONALIZATION,
]);

// Validate status values
const insightStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'implemented']);

// Validate campaign experiment status values
const experimentStatusSchema = z.enum(['running', 'paused', 'completed', 'archived']);

// Campaign variant schema
const campaignVariantSchema = z.object({
  id: z.string(),
  description: z.string(),
  content: z.string().optional(),
  audience: z.string().optional(),
  pricingModel: z.string().optional(),
  scheduleTimes: z.array(z.string()).optional(),
});

// Client persona schema
const clientPersonaSchema = z.object({
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  engagementPatterns: z.record(z.any()).optional(),
});

export const insightsRouter = router({
  /**
   * Get all insights for a client
   */
  getAll: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Get insights from service
        const reasoningService = new ReasoningService(clientId);
        const insights = await reasoningService.getInsights();
        
        return insights;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to get insights');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to get insights'
        });
      }
    }),
  
  /**
   * Generate a specific type of insight
   */
  generate: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      type: insightTypeSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, type } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Generate insight
        const reasoningService = new ReasoningService(clientId);
        const insight = await reasoningService.generateInsight(type);
        
        return insight;
      } catch (error) {
        logger.error({ error, userId, clientId, type }, 'Failed to generate insight');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to generate insight'
        });
      }
    }),
  
  /**
   * Update the status of an insight
   */
  updateStatus: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      insightId: z.string(),
      status: insightStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, insightId, status } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Update insight status
        const reasoningService = new ReasoningService(clientId);
        const updatedInsight = await reasoningService.updateInsightStatus(insightId, status);
        
        return updatedInsight;
      } catch (error) {
        logger.error({ error, userId, clientId, insightId, status }, 'Failed to update insight status');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to update insight status'
        });
      }
    }),
  
  /**
   * Get all A/B testing campaign experiments for a client
   */
  getCampaignExperiments: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Get experiments from service
        const reasoningService = new ReasoningService(clientId);
        const experiments = await reasoningService.getCampaignExperiments();
        
        return experiments;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to get campaign experiments');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to get campaign experiments'
        });
      }
    }),
  
  /**
   * Create a new A/B testing campaign experiment
   */
  createCampaignExperiment: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      variants: z.array(campaignVariantSchema),
      goalMetric: z.string(),
      controlVariantId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, name, description, variants, goalMetric, controlVariantId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Create experiment
        const reasoningService = new ReasoningService(clientId);
        const experiment = await reasoningService.createCampaignExperiment(
          name,
          description || '',
          variants,
          goalMetric,
          controlVariantId
        );
        
        return experiment;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to create campaign experiment');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to create campaign experiment'
        });
      }
    }),
  
  /**
   * Update an existing A/B testing campaign experiment
   */
  updateCampaignExperiment: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      experimentId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: experimentStatusSchema.optional(),
      variants: z.array(campaignVariantSchema).optional(),
      goalMetric: z.string().optional(),
      controlVariantId: z.string().optional(),
      performanceData: z.record(z.record(z.any())).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, experimentId, ...updateData } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Update experiment
        const reasoningService = new ReasoningService(clientId);
        const experiment = await reasoningService.updateCampaignExperiment(
          experimentId,
          updateData
        );
        
        return experiment;
      } catch (error) {
        logger.error({ error, userId, clientId, experimentId }, 'Failed to update campaign experiment');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to update campaign experiment'
        });
      }
    }),
  
  /**
   * Generate a conclusion for an A/B testing campaign experiment
   */
  generateExperimentConclusion: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      experimentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, experimentId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Generate conclusion
        const reasoningService = new ReasoningService(clientId);
        const conclusion = await reasoningService.generateExperimentConclusion(experimentId);
        
        return { conclusion };
      } catch (error) {
        logger.error({ error, userId, clientId, experimentId }, 'Failed to generate experiment conclusion');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to generate experiment conclusion'
        });
      }
    }),
  
  /**
   * Get client persona
   */
  getClientPersona: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Get client persona
        const reasoningService = new ReasoningService(clientId);
        const persona = await reasoningService.getClientPersona();
        
        return persona;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to get client persona');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to get client persona'
        });
      }
    }),
  
  /**
   * Update client persona
   */
  updateClientPersona: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      data: clientPersonaSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, data } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Update client persona
        const reasoningService = new ReasoningService(clientId);
        const persona = await reasoningService.updateClientPersona(data);
        
        return persona;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to update client persona');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to update client persona'
        });
      }
    }),
  
  /**
   * Generate personalized insights
   */
  generatePersonalizedInsights: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      try {
        // Verify client ownership
        await verifyClientOwnership(userId, clientId);
        
        // Generate personalized insights
        const reasoningService = new ReasoningService(clientId);
        const insights = await reasoningService.generatePersonalizedInsights();
        
        return insights;
      } catch (error) {
        logger.error({ error, userId, clientId }, 'Failed to generate personalized insights');
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to generate personalized insights'
        });
      }
    }),
}); 