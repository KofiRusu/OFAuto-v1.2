import { z } from "zod";

/**
 * Schema for Google Drive OAuth connection code
 */
export const DriveConnectSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

export type DriveConnectInput = z.infer<typeof DriveConnectSchema>;

/**
 * Schema for Drive credential response
 */
export const DriveCredentialResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DriveCredentialResponse = z.infer<typeof DriveCredentialResponseSchema>;

/**
 * Schema for Drive file representation
 */
export const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  modifiedTime: z.string().transform((val) => new Date(val)),
  iconLink: z.string().optional(),
  webViewLink: z.string().optional(),
  thumbnailLink: z.string().optional(),
  size: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
});

export type DriveFile = z.infer<typeof DriveFileSchema>;

/**
 * Schema for file upload input
 */
export const DriveUploadSchema = z.object({
  name: z.string().min(1, "File name is required"),
  content: z.string(), // Base64 encoded file content
  mimeType: z.string().optional(),
  folderId: z.string().optional(),
});

export type DriveUploadInput = z.infer<typeof DriveUploadSchema>; 