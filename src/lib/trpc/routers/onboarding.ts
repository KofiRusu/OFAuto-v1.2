import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  router, 
  protectedProcedure, 
  adminProcedure 
} from "../server";
import {
  createOnboardingProfileSchema,
  updateOnboardingProfileSchema,
  createBankAccountSchema,
  updateBankAccountSchema,
  createCommissionSplitSchema,
  updateCommissionSplitSchema,
  createContractSchema,
} from "@/lib/schemas/onboarding";

export const onboardingRouter = router({
  /**
   * Create or update onboarding profile
   */
  completeProfile: protectedProcedure
    .input(createOnboardingProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      // Check if profile already exists
      const existingProfile = await ctx.prisma.onboardingProfile.findUnique({
        where: { userId: userId as string },
      });

      if (existingProfile) {
        // Update existing profile
        return await ctx.prisma.onboardingProfile.update({
          where: { id: existingProfile.id },
          data: {
            ...input,
            // Set the userId explicitly from context for security
            userId: userId as string,
          },
        });
      } else {
        // Create new profile
        return await ctx.prisma.onboardingProfile.create({
          data: {
            ...input,
            // Set the userId explicitly from context for security
            userId: userId as string,
          },
        });
      }
    }),

  /**
   * Get current user's onboarding profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    
    const profile = await ctx.prisma.onboardingProfile.findUnique({
      where: { userId: userId as string },
    });
    
    return profile;
  }),

  /**
   * Upload bank account information
   */
  uploadBankInfo: protectedProcedure
    .input(createBankAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      // Check if this is the first account (should be set as primary)
      const existingAccounts = await ctx.prisma.bankAccount.count({
        where: { userId: userId as string },
      });
      
      const isPrimary = existingAccounts === 0;
      
      // Create bank account
      return await ctx.prisma.bankAccount.create({
        data: {
          ...input,
          userId: userId as string,
          primary: isPrimary,
        },
      });
    }),
    
  /**
   * Get user's bank accounts
   */
  getBankAccounts: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    
    return await ctx.prisma.bankAccount.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
  }),
  
  /**
   * Set a bank account as primary
   */
  setPrimaryBankAccount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { userId } = ctx;
      
      // Verify ownership
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id },
      });
      
      if (!account || account.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this bank account',
        });
      }
      
      // Reset all accounts to non-primary
      await ctx.prisma.bankAccount.updateMany({
        where: { userId: userId as string },
        data: { primary: false },
      });
      
      // Set the selected account as primary
      return await ctx.prisma.bankAccount.update({
        where: { id },
        data: { primary: true },
      });
    }),
  
  /**
   * Delete a bank account
   */
  deleteBankAccount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { userId } = ctx;
      
      // Verify ownership
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id },
      });
      
      if (!account || account.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this bank account',
        });
      }
      
      await ctx.prisma.bankAccount.delete({
        where: { id },
      });
      
      return { success: true };
    }),

  /**
   * Invite a model with commission split arrangement
   */
  inviteModel: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      percentage: z.number().min(0).max(100),
      startDate: z.date().optional(),
      endDate: z.date().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, percentage, startDate, endDate } = input;
      const { userId } = ctx;
      
      // Check if invited user exists
      const invitedUser = await ctx.prisma.user.findUnique({
        where: { email },
      });
      
      if (!invitedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User with this email not found',
        });
      }
      
      // Create commission split arrangement
      const commissionSplit = await ctx.prisma.commissionSplit.create({
        data: {
          ownerId: userId as string,
          sharerId: invitedUser.id,
          percentage,
          startDate: startDate || new Date(),
          endDate,
          active: true,
        },
      });
      
      // TODO: Send notification or email to the invited model
      
      return commissionSplit;
    }),
    
  /**
   * Get commission splits where current user is the owner
   */
  getOwnedCommissionSplits: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    
    return await ctx.prisma.commissionSplit.findMany({
      where: { ownerId: userId as string },
      include: {
        sharer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Generate a contract for signature
   */
  generateContract: protectedProcedure
    .input(createContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      
      // Create contract record
      const contract = await ctx.prisma.contract.create({
        data: {
          ...input,
          userId: userId as string,
        },
      });
      
      return contract;
    }),
    
  /**
   * Sign a contract
   */
  signContract: protectedProcedure
    .input(z.object({
      id: z.string(),
      signatureUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, signatureUrl } = input;
      const { userId } = ctx;
      
      // Verify ownership
      const contract = await ctx.prisma.contract.findUnique({
        where: { id },
      });
      
      if (!contract || contract.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to sign this contract',
        });
      }
      
      if (contract.signed) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This contract has already been signed',
        });
      }
      
      // Update contract as signed
      return await ctx.prisma.contract.update({
        where: { id },
        data: {
          signed: true,
          signedAt: new Date(),
          signatureUrl,
          status: 'ACTIVE',
        },
      });
    }),
    
  /**
   * Get user's contracts
   */
  getContracts: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    
    return await ctx.prisma.contract.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
    });
  }),
  
  /**
   * Admin-only: Get all contracts
   */
  getAllContracts: adminProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Apply status filter if provided
      const where = input?.status 
        ? { status: input.status } 
        : {};
        
      return await ctx.prisma.contract.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),
  
  /**
   * Admin-only: Approve or reject KYC
   */
  updateKycStatus: adminProcedure
    .input(z.object({
      userId: z.string(),
      kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'REVIEW']),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, kycStatus, message } = input;
      
      // Update profile KYC status
      const profile = await ctx.prisma.onboardingProfile.update({
        where: { userId },
        data: {
          kycStatus,
          kycCompletedAt: kycStatus === 'VERIFIED' ? new Date() : null,
        },
      });
      
      // TODO: Send notification to user about KYC status update
      
      return profile;
    }),
}); 