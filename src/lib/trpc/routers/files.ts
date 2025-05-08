import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../server";
import { fileUploadUrlSchema, fileDownloadUrlSchema } from "@/lib/schemas/kyc";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME || "ofauto-documents";

export const filesRouter = router({
  /**
   * Generate a pre-signed URL for uploading a file to S3
   */
  getUploadUrl: protectedProcedure
    .input(fileUploadUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const { fileName, contentType, profileId, fileType } = input;
      const { userId } = ctx;
      
      // Check if user is allowed to upload for this profile
      const profile = await ctx.prisma.onboardingProfile.findUnique({
        where: { id: profileId },
      });
      
      // Only allow upload if it's the user's own profile or an admin
      if (!profile || (profile.userId !== userId && ctx.user?.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to upload documents for this profile",
        });
      }
      
      // Generate a unique file key
      const fileExtension = fileName.split(".").pop() || "";
      const fileKey = `${fileType.toLowerCase()}/${profileId}/${uuidv4()}.${fileExtension}`;
      
      // Create the presigned URL for upload
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ContentType: contentType,
        // Additional metadata to identify the file
        Metadata: {
          profileId,
          fileType,
          uploadedBy: userId as string,
        },
      });
      
      try {
        // Generate presigned URL valid for 15 minutes
        const presignedUrl = await getSignedUrl(s3Client, putCommand, { 
          expiresIn: 15 * 60 // 15 minutes
        });
        
        return {
          uploadUrl: presignedUrl,
          fileKey,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
      } catch (error) {
        console.error("Error generating upload URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate upload URL",
        });
      }
    }),
    
  /**
   * Generate a pre-signed URL for downloading a file from S3
   */
  getDownloadUrl: protectedProcedure
    .input(fileDownloadUrlSchema)
    .query(async ({ ctx, input }) => {
      const { fileKey } = input;
      const { userId, user } = ctx;
      
      // Extract profile ID from file key (fileType/profileId/uuid.ext)
      const keyParts = fileKey.split("/");
      if (keyParts.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file key format",
        });
      }
      
      const profileId = keyParts[1];
      
      // Check if user is allowed to download this file
      const profile = await ctx.prisma.onboardingProfile.findUnique({
        where: { id: profileId },
      });
      
      // Only allow download if it's the user's own profile or an admin
      if (!profile || (profile.userId !== userId && user?.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to download this document",
        });
      }
      
      // Create the presigned URL for download
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      });
      
      try {
        // Generate presigned URL valid for 1 hour
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { 
          expiresIn: 60 * 60 // 1 hour
        });
        
        return {
          downloadUrl: presignedUrl,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        };
      } catch (error) {
        console.error("Error generating download URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate download URL",
        });
      }
    }),
    
  /**
   * Associate an uploaded file with a KYC review
   */
  attachFileToReview: adminProcedure
    .input(z.object({
      reviewId: z.string(),
      fileKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { reviewId, fileKey } = input;
      
      // Check if review exists
      const review = await ctx.prisma.kycReview.findUnique({
        where: { id: reviewId },
      });
      
      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }
      
      // Add document URL to the review
      const updatedReview = await ctx.prisma.kycReview.update({
        where: { id: reviewId },
        data: {
          documentUrls: {
            push: fileKey,
          },
        },
      });
      
      return updatedReview;
    }),
    
  /**
   * List files associated with a profile
   */
  listProfileFiles: protectedProcedure
    .input(z.object({
      profileId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { profileId } = input;
      const { userId, user } = ctx;
      
      // Check if user is allowed to view files for this profile
      const profile = await ctx.prisma.onboardingProfile.findUnique({
        where: { id: profileId },
      });
      
      // Only allow access if it's the user's own profile or an admin
      if (!profile || (profile.userId !== userId && user?.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view documents for this profile",
        });
      }
      
      // Get all reviews for the profile and extract document URLs
      const reviews = await ctx.prisma.kycReview.findMany({
        where: { profileId },
        orderBy: { createdAt: "desc" },
        select: { 
          id: true,
          status: true,
          createdAt: true,
          documentUrls: true,
        },
      });
      
      // Flatten and organize files
      const files = reviews.flatMap(review => 
        review.documentUrls.map(fileKey => ({
          fileKey,
          reviewId: review.id,
          reviewStatus: review.status,
          uploadedAt: review.createdAt,
          // Extract file type from the key
          fileType: fileKey.split('/')[0].toUpperCase(),
        }))
      );
      
      return files;
    }),
}); 