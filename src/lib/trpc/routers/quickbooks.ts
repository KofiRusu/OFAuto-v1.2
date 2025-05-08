import { TRPCError } from "@trpc/server";
import { router, managerProcedure } from "../server";
import { 
  QuickBooksConnectSchema, 
  QuickBooksRefreshSchema, 
  QuickBooksStatusSchema,
  ConnectionStatusSchema
} from "@/lib/schemas/quickbooks";
import { z } from "zod";
import { exchangeOAuthCode, refreshAccessToken, getConnectionStatus } from "@/lib/services/quickBooksService";

export const quickBooksRouter = router({
  /**
   * Connect a client to QuickBooks
   */
  connectQuickBooks: managerProcedure
    .input(QuickBooksConnectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { clientId, realmId, accessToken, refreshToken, expiresIn } = input;

        // Verify the client exists and the user has access
        const client = await ctx.prisma.client.findUnique({
          where: { id: clientId },
          include: {
            quickBooksConnections: true,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Check if this user has access to this client
        if (ctx.user.role !== "ADMIN" && client.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to connect QuickBooks for this client",
          });
        }

        // Check if we need to update an existing connection or create a new one
        let connection;
        if (client.quickBooksConnections.length > 0) {
          // Update existing connection
          connection = await ctx.prisma.quickBooksConnection.update({
            where: { id: client.quickBooksConnections[0].id },
            data: {
              realmId,
              accessToken,
              refreshToken,
              status: "CONNECTED",
            },
          });
        } else {
          // Create new connection
          connection = await ctx.prisma.quickBooksConnection.create({
            data: {
              clientId,
              realmId,
              accessToken,
              refreshToken,
              status: "CONNECTED",
            },
          });
        }

        return {
          success: true,
          connection,
        };
      } catch (error) {
        ctx.logger.error("Error connecting to QuickBooks", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect to QuickBooks",
          cause: error,
        });
      }
    }),

  /**
   * Refresh QuickBooks access token
   */
  refreshQuickBooksToken: managerProcedure
    .input(QuickBooksRefreshSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { refreshToken } = input;

        // Get the token response from QuickBooks
        const tokenResponse = await refreshAccessToken(refreshToken);

        // Find the connection in the database
        const connection = await ctx.prisma.quickBooksConnection.findFirst({
          where: { refreshToken },
        });

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "QuickBooks connection not found",
          });
        }

        // Verify the user has access to this client's connection
        const client = await ctx.prisma.client.findUnique({
          where: { id: connection.clientId },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Check permissions
        if (ctx.user.role !== "ADMIN" && client.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to refresh tokens for this client",
          });
        }

        // Update the connection in the database
        const updatedConnection = await ctx.prisma.quickBooksConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            status: "CONNECTED",
          },
        });

        return {
          success: true,
          connection: updatedConnection,
        };
      } catch (error) {
        ctx.logger.error("Error refreshing QuickBooks token", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refresh QuickBooks token",
          cause: error,
        });
      }
    }),

  /**
   * Get QuickBooks connection status
   */
  getQuickBooksStatus: managerProcedure
    .input(z.object({ clientId: z.string().uuid("Invalid client ID") }))
    .query(async ({ ctx, input }) => {
      try {
        const { clientId } = input;

        // Verify the client exists and the user has access
        const client = await ctx.prisma.client.findUnique({
          where: { id: clientId },
          include: {
            quickBooksConnections: true,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Check if this user has access to this client
        if (ctx.user.role !== "ADMIN" && client.userId !== ctx.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view QuickBooks status for this client",
          });
        }

        // If no connection, return not connected
        if (client.quickBooksConnections.length === 0) {
          return {
            status: "PENDING" as const,
            connectedAt: null,
          };
        }

        const connection = client.quickBooksConnections[0];

        // Check connection with QuickBooks API
        const status = await getConnectionStatus(
          connection.accessToken,
          connection.realmId
        );

        // Update connection status if it has changed
        if (status !== connection.status) {
          await ctx.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: { status },
          });
        }

        return {
          status,
          connectedAt: connection.createdAt,
        };
      } catch (error) {
        ctx.logger.error("Error getting QuickBooks status", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get QuickBooks status",
          cause: error,
        });
      }
    }),
}); 