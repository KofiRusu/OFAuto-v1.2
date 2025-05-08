import { TRPCError } from "@trpc/server";
import { router, managerProcedure } from "../server";
import { 
  CrmConnectionCreateSchema, 
  CrmStatusResponseSchema, 
  CrmStatusQuerySchema, 
  CrmAccountSchema
} from "@/lib/schemas/crm";
import { z } from "zod";
import { 
  testCrmConnection, 
  fetchCrmAccounts, 
  getCrmConnectionStatus 
} from "@/lib/services/crmService";

export const crmRouter = router({
  /**
   * Connect a client to a CRM system
   */
  connectCrm: managerProcedure
    .input(CrmConnectionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { clientId, apiKey, domain } = input;

        // Verify the client exists and the user has access
        const client = await ctx.prisma.client.findUnique({
          where: { id: clientId },
          include: {
            crmConnections: true,
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
            message: "You don't have permission to connect CRM for this client",
          });
        }

        // Test the connection before saving
        const connectionWorks = await testCrmConnection(apiKey, domain);
        const connectionStatus = connectionWorks ? "CONNECTED" : "FAILED";

        // Check if we need to update an existing connection or create a new one
        let connection;
        if (client.crmConnections.length > 0) {
          // Update existing connection
          connection = await ctx.prisma.crmConnection.update({
            where: { id: client.crmConnections[0].id },
            data: {
              apiKey,
              domain,
              status: connectionStatus,
            },
          });
        } else {
          // Create new connection
          connection = await ctx.prisma.crmConnection.create({
            data: {
              clientId,
              apiKey,
              domain,
              status: connectionStatus,
            },
          });
        }

        return {
          success: connectionWorks,
          connection,
          message: connectionWorks 
            ? "CRM connected successfully" 
            : "Failed to connect to CRM API",
        };
      } catch (error) {
        ctx.logger.error("Error connecting to CRM", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect to CRM",
          cause: error,
        });
      }
    }),

  /**
   * Get CRM connection status
   */
  getCrmStatus: managerProcedure
    .input(z.object({ connectionId: z.string().uuid("Invalid connection ID") }))
    .query(async ({ ctx, input }) => {
      try {
        const { connectionId } = input;

        // Get the connection to check
        const connection = await ctx.prisma.crmConnection.findUnique({
          where: { id: connectionId },
          include: {
            client: true,
          },
        });

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CRM connection not found",
          });
        }

        // Check if this user has access to this client's connection
        if (
          ctx.user.role !== "ADMIN" && 
          connection.client.userId !== ctx.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this CRM connection",
          });
        }

        // Get the current connection status
        const status = await getCrmConnectionStatus(connectionId);

        return {
          ...status,
          connectionId,
        };
      } catch (error) {
        ctx.logger.error("Error getting CRM status", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get CRM status",
          cause: error,
        });
      }
    }),

  /**
   * List accounts from a CRM connection
   */
  listCrmAccounts: managerProcedure
    .input(z.object({ connectionId: z.string().uuid("Invalid connection ID") }))
    .query(async ({ ctx, input }) => {
      try {
        const { connectionId } = input;

        // Get the connection to check
        const connection = await ctx.prisma.crmConnection.findUnique({
          where: { id: connectionId },
          include: {
            client: true,
          },
        });

        if (!connection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CRM connection not found",
          });
        }

        // Check if this user has access to this client's connection
        if (
          ctx.user.role !== "ADMIN" && 
          connection.client.userId !== ctx.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to access this CRM's accounts",
          });
        }

        // Fetch accounts from the CRM
        const accounts = await fetchCrmAccounts(connectionId);

        return {
          accounts,
          count: accounts.length,
        };
      } catch (error) {
        ctx.logger.error("Error listing CRM accounts", { error });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message || "Failed to list CRM accounts",
          cause: error,
        });
      }
    }),
}); 