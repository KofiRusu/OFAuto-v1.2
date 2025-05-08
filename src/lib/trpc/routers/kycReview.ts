import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../server";
import {
  approveKycReviewSchema,
  rejectKycReviewSchema,
  requestAdditionalInfoSchema,
  KycReviewRead, 
  KycReviewUpdate,
  KycReviewCreate
} from "@/lib/schemas/kyc";

export const kycReviewRouter = router({
  /**
   * List pending KYC reviews with user data
   */
  listPending: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(["PENDING", "APPROVED", "REJECTED", "ADDITIONAL_INFO_REQUESTED", "pending", "approved", "rejected"])
            .optional(),
          limit: z.number().min(1).max(100).optional().default(20),
          offset: z.number().min(0).optional().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, limit, offset } = input || {};

      // Normalize status value to match database enum
      let dbStatus = status;
      if (status === "pending") dbStatus = "PENDING";
      if (status === "approved") dbStatus = "APPROVED";
      if (status === "rejected") dbStatus = "REJECTED";

      // Fetch profiles with pending KYC status
      const profiles = await ctx.prisma.onboardingProfile.findMany({
        where: {
          // If status is provided, filter by it, otherwise get all pending profiles
          kycStatus: dbStatus ? 
            (dbStatus === "ADDITIONAL_INFO_REQUESTED" ? "REVIEW" : dbStatus) : 
            "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          reviews: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      // Get total count for pagination
      const totalCount = await ctx.prisma.onboardingProfile.count({
        where: {
          kycStatus: dbStatus ? 
            (dbStatus === "ADDITIONAL_INFO_REQUESTED" ? "REVIEW" : dbStatus) : 
            "PENDING",
        },
      });

      return {
        profiles,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    }),

  /**
   * Get a KYC review by profile ID
   */
  getByProfileId: adminProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profileId } = input;

      const profile = await ctx.prisma.onboardingProfile.findUnique({
        where: { id: profileId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          reviews: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      return profile;
    }),

  /**
   * Approve a KYC review
   */
  approve: adminProcedure
    .input(approveKycReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;
      const { userId } = ctx;

      // Find the review
      const review = await ctx.prisma.kycReview.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Only allow modifying pending reviews
      if (review.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve a review with status ${review.status}`,
        });
      }

      // Update the review status
      const updatedReview = await ctx.prisma.kycReview.update({
        where: { id },
        data: {
          status: "APPROVED",
          reason: reason,
          reviewerId: userId as string,
          reviewedAt: new Date(), // Set the review timestamp
        },
      });

      // Update the profile KYC status
      await ctx.prisma.onboardingProfile.update({
        where: { id: review.profileId },
        data: {
          kycStatus: "VERIFIED",
          kycCompletedAt: new Date(),
        },
      });

      return updatedReview;
    }),

  /**
   * Reject a KYC review
   */
  reject: adminProcedure
    .input(rejectKycReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, rejectionReason, reason } = input;
      const { userId } = ctx;

      // Find the review
      const review = await ctx.prisma.kycReview.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Only allow modifying pending reviews
      if (review.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject a review with status ${review.status}`,
        });
      }

      // Update the review status
      const updatedReview = await ctx.prisma.kycReview.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason,
          reason: reason,
          reviewerId: userId as string,
          reviewedAt: new Date(), // Set the review timestamp
        },
      });

      // Update the profile KYC status
      await ctx.prisma.onboardingProfile.update({
        where: { id: review.profileId },
        data: {
          kycStatus: "REJECTED",
        },
      });

      return updatedReview;
    }),

  /**
   * Request additional information for a KYC review
   */
  requestAdditionalInfo: adminProcedure
    .input(requestAdditionalInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, reason, documentTypes } = input;
      const { userId } = ctx;

      // Find the review
      const review = await ctx.prisma.kycReview.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Update the review status
      const updatedReview = await ctx.prisma.kycReview.update({
        where: { id },
        data: {
          status: "ADDITIONAL_INFO_REQUESTED",
          reason,
          reviewerId: userId as string,
          reviewedAt: new Date(), // Set the review timestamp
        },
      });

      // Update the profile KYC status
      await ctx.prisma.onboardingProfile.update({
        where: { id: review.profileId },
        data: {
          kycStatus: "REVIEW",
        },
      });

      return updatedReview;
    }),

  /**
   * Create a new KYC review for a profile
   */
  create: adminProcedure
    .input(
      z.object({
        profileId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profileId, reason } = input;
      const { userId } = ctx;

      // Check if profile exists
      const profile = await ctx.prisma.onboardingProfile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      // Create new review
      const review = await ctx.prisma.kycReview.create({
        data: {
          profileId,
          reviewerId: userId as string,
          status: "PENDING",
          reason,
          documentUrls: [],
        },
      });

      return review;
    }),
}); 