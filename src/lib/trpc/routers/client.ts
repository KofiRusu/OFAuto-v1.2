import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  router, 
  protectedProcedure, 
  managerProcedure 
} from "../server";

export const clientRouter = router({
  /**
   * Get all clients based on user role
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { userId, user } = ctx;

    // If admin, return all clients
    // If manager or user, only return their assigned clients
    if (user.role === 'ADMIN') {
      return await ctx.prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
    } else {
      return await ctx.prisma.client.findMany({
        where: { userId: userId as string },
        orderBy: { createdAt: "desc" }
      });
    }
  }),
  
  /**
   * Get a client by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      const client = await ctx.prisma.client.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }
      
      // Check if the user has access to this client
      if (user.role !== 'ADMIN' && client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this client',
        });
      }
      
      return client;
    }),
  
  /**
   * Create a new client
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Client name is required'),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, phone, userId } = input;
      
      const client = await ctx.prisma.client.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          userId: userId || ctx.userId,
        },
      });
      
      return client;
    }),
  
  /**
   * Update a client
   */
  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, 'Client name is required'),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, email, phone, userId } = input;
      const { user } = ctx;
      
      // First check if the client exists and if the user can modify it
      const existingClient = await ctx.prisma.client.findUnique({
        where: { id },
      });
      
      if (!existingClient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }
      
      // Only allow admins to change the assigned user
      // or allow the current assigned user to update other fields
      if (user.role !== 'ADMIN' && existingClient.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this client',
        });
      }
      
      // Update client
      const updatedClient = await ctx.prisma.client.update({
        where: { id },
        data: {
          name,
          email: email || null,
          phone: phone || null,
          // Only allow changing userId if admin
          ...(user.role === 'ADMIN' && { userId: userId || existingClient.userId }),
        },
      });
      
      return updatedClient;
    }),
  
  /**
   * Delete a client
   */
  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { user, userId } = ctx;
      
      // First check if the client exists and if the user can delete it
      const existingClient = await ctx.prisma.client.findUnique({
        where: { id },
      });
      
      if (!existingClient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }
      
      // Only admins can delete any client
      // Managers can only delete their own clients
      if (user.role !== 'ADMIN' && existingClient.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this client',
        });
      }
      
      // Delete client
      await ctx.prisma.client.delete({
        where: { id },
      });
      
      return { success: true };
    }),
}); 