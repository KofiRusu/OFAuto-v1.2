import { z } from 'zod';

// Import the ConnectionStatus enum to match Prisma
export const ConnectionStatusSchema = z.enum(['PENDING', 'CONNECTED', 'FAILED']);

// Schema for connecting to QuickBooks
export const QuickBooksConnectSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  realmId: z.string().min(1, "Realm ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1, "Refresh token is required"),
  expiresIn: z.number().int().positive("Expires in must be a positive integer"),
});

// Schema for refreshing QuickBooks connection
export const QuickBooksRefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Schema for QuickBooks connection status
export const QuickBooksStatusSchema = z.object({
  status: ConnectionStatusSchema,
  connectedAt: z.date(),
});

// Schema for QuickBooks connection response
export const QuickBooksConnectionResponseSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  realmId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  status: ConnectionStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export types
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;
export type QuickBooksConnect = z.infer<typeof QuickBooksConnectSchema>;
export type QuickBooksRefresh = z.infer<typeof QuickBooksRefreshSchema>;
export type QuickBooksStatus = z.infer<typeof QuickBooksStatusSchema>;
export type QuickBooksConnectionResponse = z.infer<typeof QuickBooksConnectionResponseSchema>; 