import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../server";
import { applyImageWatermark, uploadToS3, WatermarkOptions } from "@/services/watermarkService";
import { v4 as uuidv4 } from "uuid";

// File upload schema
const uploadMediaSchema = z.object({
  base64Data: z.string(),
  fileName: z.string(),
  contentType: z.string().startsWith("image/"),
});

// Watermark schema
const applyWatermarkSchema = z.object({
  mediaId: z.string(),
  watermarkProfileId: z.string(),
  options: z
    .object({
      position: z.enum(["topLeft", "topRight", "bottomLeft", "bottomRight", "center"]).optional(),
      opacity: z.number().min(0).max(1).optional(),
      scale: z.number().min(0.05).max(1).optional(),
      margin: z.number().min(0).optional(),
    })
    .optional(),
});

// Schema for retrieving media assets
const getMediaAssetsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  filterByOwnerId: z.string().optional(),
});

// Schema for retrieving watermark profiles
const getWatermarkProfilesSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Schema for creating a watermark profile
const createWatermarkProfileSchema = z.object({
  name: z.string().min(1),
  logoBase64: z.string(),
  position: z.enum(["topLeft", "topRight", "bottomLeft", "bottomRight", "center"]).default("bottomRight"),
  opacity: z.number().min(0).max(1).default(0.5),
});

export const mediaRouter = router({
  /**
   * Upload a media asset
   */
  uploadMedia: protectedProcedure
    .input(uploadMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const { base64Data, fileName, contentType } = input;
      const { userId } = ctx;

      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");

        // Generate S3 key
        const fileExtension = fileName.split(".").pop() || "jpg";
        const fileKey = `media/${userId}/${uuidv4()}.${fileExtension}`;

        // Upload to S3
        const url = await uploadToS3(buffer, fileKey, contentType);

        // Store metadata in DB
        const mediaAsset = await ctx.prisma.mediaAsset.create({
          data: {
            url,
            ownerId: userId,
          },
        });

        return {
          id: mediaAsset.id,
          url: mediaAsset.url,
        };
      } catch (error) {
        console.error("Error uploading media:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload media",
        });
      }
    }),

  /**
   * Apply watermark to media
   */
  applyWatermark: managerProcedure
    .input(applyWatermarkSchema)
    .mutation(async ({ ctx, input }) => {
      const { mediaId, watermarkProfileId, options } = input;
      const { userId } = ctx;

      try {
        // Fetch media asset
        const mediaAsset = await ctx.prisma.mediaAsset.findUnique({
          where: { id: mediaId },
        });

        if (!mediaAsset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Media asset not found",
          });
        }

        // Fetch watermark profile
        const watermarkProfile = await ctx.prisma.watermarkProfile.findUnique({
          where: { id: watermarkProfileId },
        });

        if (!watermarkProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Watermark profile not found",
          });
        }

        // Check permissions - only owner or admin can apply watermark
        if (
          mediaAsset.ownerId !== userId &&
          watermarkProfile.ownerId !== userId &&
          ctx.user?.role !== "ADMIN"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to apply this watermark",
          });
        }

        // Fetch the media asset and logo
        const mediaResponse = await fetch(mediaAsset.url);
        const logoResponse = await fetch(watermarkProfile.logoUrl);

        if (!mediaResponse.ok || !logoResponse.ok) {
          throw new Error("Failed to fetch media or logo");
        }

        const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
        const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

        // Apply watermark
        const watermarkOptions: Partial<WatermarkOptions> = {
          position: watermarkProfile.position as "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center",
          opacity: watermarkProfile.opacity,
          ...options,
        };

        const watermarkedBuffer = await applyImageWatermark(mediaBuffer, logoBuffer, watermarkOptions);

        // Generate S3 key for watermarked image
        const originalUrl = new URL(mediaAsset.url);
        const pathParts = originalUrl.pathname.split("/");
        const fileName = pathParts.pop() || "";
        const fileExtension = fileName.split(".").pop() || "jpg";
        const fileKey = `watermarked/${mediaId}/${watermarkProfileId}/${uuidv4()}.${fileExtension}`;

        // Upload watermarked image
        const contentType = mediaResponse.headers.get("content-type") || "image/jpeg";
        const watermarkedUrl = await uploadToS3(watermarkedBuffer, fileKey, contentType);

        // Save watermarked media in database
        const watermarkedMedia = await ctx.prisma.watermarkedMedia.create({
          data: {
            originalMediaId: mediaId,
            watermarkProfileId,
            processedUrl: watermarkedUrl,
          },
        });

        return {
          id: watermarkedMedia.id,
          url: watermarkedMedia.processedUrl,
        };
      } catch (error) {
        console.error("Error applying watermark:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply watermark",
        });
      }
    }),

  /**
   * Get processed media
   */
  getProcessedMedia: protectedProcedure
    .input(
      z.object({
        mediaId: z.string(),
        watermarkProfileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { mediaId, watermarkProfileId } = input;
      const { userId } = ctx;

      // Check if media exists and user has permission to access it
      const mediaAsset = await ctx.prisma.mediaAsset.findUnique({
        where: { id: mediaId },
      });

      if (!mediaAsset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media asset not found",
        });
      }

      // For non-admin users, only allow if they own the media
      if (mediaAsset.ownerId !== userId && ctx.user?.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this media",
        });
      }

      // Build query for watermarked media
      const whereClause: any = { originalMediaId: mediaId };
      if (watermarkProfileId) {
        whereClause.watermarkProfileId = watermarkProfileId;
      }

      // Get watermarked versions
      const watermarkedMedia = await ctx.prisma.watermarkedMedia.findMany({
        where: whereClause,
        include: {
          watermarkProfile: {
            select: {
              id: true,
              name: true,
              position: true,
              opacity: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        original: mediaAsset,
        watermarked: watermarkedMedia,
      };
    }),

  /**
   * Get media assets
   */
  getMediaAssets: protectedProcedure
    .input(getMediaAssetsSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filterByOwnerId } = input;
      const { userId, user } = ctx;

      // For regular users, only show their own media
      // For admins/managers, allow filtering by owner ID
      const ownerId = user?.role === "ADMIN" || user?.role === "MANAGER" 
        ? filterByOwnerId || userId 
        : userId;

      const mediaAssets = await ctx.prisma.mediaAsset.findMany({
        where: { ownerId },
        take: limit + 1, // Take an extra item to determine if there are more items
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | undefined = undefined;
      if (mediaAssets.length > limit) {
        const nextItem = mediaAssets.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: mediaAssets,
        nextCursor,
      };
    }),

  /**
   * Create watermark profile
   */
  createWatermarkProfile: managerProcedure
    .input(createWatermarkProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, logoBase64, position, opacity } = input;
      const { userId } = ctx;

      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(logoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");

        // Generate S3 key
        const fileKey = `watermark-logos/${userId}/${uuidv4()}.png`;

        // Upload to S3
        const logoUrl = await uploadToS3(buffer, fileKey, "image/png");

        // Store in DB
        const watermarkProfile = await ctx.prisma.watermarkProfile.create({
          data: {
            name,
            logoUrl,
            position,
            opacity,
            ownerId: userId,
          },
        });

        return watermarkProfile;
      } catch (error) {
        console.error("Error creating watermark profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create watermark profile",
        });
      }
    }),

  /**
   * Get watermark profiles
   */
  getWatermarkProfiles: protectedProcedure
    .input(getWatermarkProfilesSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const { userId, user } = ctx;

      // For admin/manager, get all profiles, for others, only their own
      const whereClause = user?.role === "ADMIN" || user?.role === "MANAGER" 
        ? {} 
        : { ownerId: userId };

      const profiles = await ctx.prisma.watermarkProfile.findMany({
        where: whereClause,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | undefined = undefined;
      if (profiles.length > limit) {
        const nextItem = profiles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: profiles,
        nextCursor,
      };
    }),
}); 