import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserRole } from "@prisma/client";
import { 
  router, 
  protectedProcedure, 
  adminProcedure 
} from "../server";

export const userRouter = router({
  /**
   * Get the current authenticated user
   */
  current: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  
  /**
   * Get all users (admin only)
   */
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),
  
  /**
   * Update a user's role (admin only)
   */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;
  
      try {
        const updatedUser = await ctx.prisma.user.update({
          where: { id: userId },
          data: { role },
          select: { 
            id: true, 
            email: true, 
            role: true 
          },
        });
  
        return updatedUser;
      } catch (error) {
        if ((error as any).code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        
        throw error;
      }
    }),
}); 