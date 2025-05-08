import { router, protectedProcedure, managerProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { DriveConnectSchema, DriveUploadSchema } from "@/lib/schemas/drive";
import { driveService } from "@/lib/services/driveService";
import { prisma } from "@/lib/db/prisma";

export const driveRouter = router({
  /**
   * Get Google Drive auth URL for OAuth flow
   * Available to both models and managers
   */
  getAuthUrl: protectedProcedure.query(async () => {
    return {
      url: driveService.getAuthUrl(),
    };
  }),

  /**
   * Connect Google Drive by exchanging code for tokens
   * Available to both models and managers
   */
  connectDrive: protectedProcedure
    .input(DriveConnectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for tokens
        const tokens = await driveService.exchangeCodeForTokens(input.code);

        // Check if user already has drive credentials
        const existingCredential = await prisma.driveCredential.findFirst({
          where: {
            userId: ctx.userId,
          },
        });

        // Update or create drive credentials
        if (existingCredential) {
          return await prisma.driveCredential.update({
            where: {
              id: existingCredential.id,
            },
            data: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            },
          });
        } else {
          return await prisma.driveCredential.create({
            data: {
              userId: ctx.userId,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            },
          });
        }
      } catch (error) {
        ctx.logger.error("Error connecting Google Drive", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect Google Drive",
        });
      }
    }),

  /**
   * Check if user has connected Google Drive
   * Available to both models and managers
   */
  getDriveStatus: protectedProcedure.query(async ({ ctx }) => {
    const credential = await prisma.driveCredential.findFirst({
      where: {
        userId: ctx.userId,
      },
    });

    return {
      connected: !!credential,
      expiresAt: credential?.expiresAt,
    };
  }),

  /**
   * Refresh Google Drive token if expired
   * Available to both models and managers
   */
  refreshDriveToken: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Get current credentials
      const credential = await prisma.driveCredential.findFirst({
        where: {
          userId: ctx.userId,
        },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Google Drive not connected. Please connect first.",
        });
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const now = new Date();
      const expiresIn = credential.expiresAt.getTime() - now.getTime();
      const isAboutToExpire = expiresIn < 5 * 60 * 1000; // 5 minutes

      if (isAboutToExpire) {
        // Refresh token
        const newTokens = await driveService.refreshTokens(credential);

        // Update in database
        return await prisma.driveCredential.update({
          where: {
            id: credential.id,
          },
          data: {
            accessToken: newTokens.accessToken,
            expiresAt: newTokens.expiresAt,
          },
        });
      }

      return credential;
    } catch (error) {
      ctx.logger.error("Error refreshing Google Drive token", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh Google Drive token",
      });
    }
  }),

  /**
   * List files from Google Drive
   * Available to both models and managers
   */
  listDriveFiles: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get credentials
        const credential = await prisma.driveCredential.findFirst({
          where: {
            userId: ctx.userId,
          },
        });

        if (!credential) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive not connected. Please connect first.",
          });
        }

        // Check if token is expired and refresh if needed
        const now = new Date();
        if (credential.expiresAt < now) {
          const newTokens = await driveService.refreshTokens(credential);
          
          // Update in database
          await prisma.driveCredential.update({
            where: {
              id: credential.id,
            },
            data: {
              accessToken: newTokens.accessToken,
              expiresAt: newTokens.expiresAt,
            },
          });
          
          // Update credential for use in the service
          credential.accessToken = newTokens.accessToken;
          credential.expiresAt = newTokens.expiresAt;
        }

        // List files
        const files = await driveService.listFiles(credential, input.folderId);
        return files;
      } catch (error) {
        ctx.logger.error("Error listing files from Google Drive", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list files from Google Drive",
        });
      }
    }),

  /**
   * Upload file to Google Drive
   * Available to both models and managers
   */
  uploadToDrive: protectedProcedure
    .input(DriveUploadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get credentials
        const credential = await prisma.driveCredential.findFirst({
          where: {
            userId: ctx.userId,
          },
        });

        if (!credential) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive not connected. Please connect first.",
          });
        }

        // Check if token is expired and refresh if needed
        const now = new Date();
        if (credential.expiresAt < now) {
          const newTokens = await driveService.refreshTokens(credential);
          
          // Update in database
          await prisma.driveCredential.update({
            where: {
              id: credential.id,
            },
            data: {
              accessToken: newTokens.accessToken,
              expiresAt: newTokens.expiresAt,
            },
          });
          
          // Update credential for use in the service
          credential.accessToken = newTokens.accessToken;
          credential.expiresAt = newTokens.expiresAt;
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.content, 'base64');

        // Upload file
        const file = await driveService.uploadFile(
          credential,
          buffer,
          input.name,
          input.mimeType,
          input.folderId
        );

        return file;
      } catch (error) {
        ctx.logger.error("Error uploading file to Google Drive", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file to Google Drive",
        });
      }
    }),

  /**
   * Create a shared folder in Google Drive
   * Manager-only procedure
   */
  createSharedFolder: managerProcedure
    .input(
      z.object({
        name: z.string().min(1, "Folder name is required"),
        userIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get manager's credentials
        const credential = await prisma.driveCredential.findFirst({
          where: {
            userId: ctx.userId,
          },
        });

        if (!credential) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Google Drive not connected. Please connect first.",
          });
        }

        // Check if token is expired and refresh if needed
        const now = new Date();
        if (credential.expiresAt < now) {
          const newTokens = await driveService.refreshTokens(credential);
          
          // Update credential
          await prisma.driveCredential.update({
            where: { id: credential.id },
            data: {
              accessToken: newTokens.accessToken,
              expiresAt: newTokens.expiresAt,
            },
          });
          
          credential.accessToken = newTokens.accessToken;
          credential.expiresAt = newTokens.expiresAt;
        }

        // Create folder
        const drive = google.drive({ 
          version: 'v3',
          auth: new google.auth.OAuth2().setCredentials({
            access_token: credential.accessToken,
            refresh_token: credential.refreshToken,
          })
        });
        
        const folderMetadata = {
          name: input.name,
          mimeType: 'application/vnd.google-apps.folder',
        };
        
        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id',
        });
        
        // If userIds provided, share the folder with each user
        if (input.userIds && input.userIds.length > 0) {
          // Get emails of users to share with
          const users = await prisma.user.findMany({
            where: {
              id: {
                in: input.userIds,
              },
            },
            select: {
              email: true,
            },
          });
          
          // Share folder with each user
          const emails = users.filter(u => u.email).map(u => u.email as string);
          
          for (const email of emails) {
            await drive.permissions.create({
              fileId: folder.data.id as string,
              requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: email,
              },
            });
          }
        }
        
        return {
          id: folder.data.id,
          name: input.name,
          shared: input.userIds ? input.userIds.length : 0,
        };
      } catch (error) {
        ctx.logger.error("Error creating shared folder", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create shared folder",
        });
      }
    }),
}); 