import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, managerProcedure } from "../server";
import { ContractCreateSchema, ContractUpdateSchema } from "@/lib/schemas/contract";

/**
 * Router for Contract operations
 */
export const contractRouter = router({
  /**
   * Create a new contract
   * Only managers can create contracts
   */
  createContract: managerProcedure
    .input(ContractCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { modelId, managerId, documentUrl } = input;
      const { userId } = ctx;

      // Verify the manager is creating the contract
      if (managerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only create contracts as the manager",
        });
      }

      // Verify the model exists
      const model = await ctx.prisma.user.findUnique({
        where: { id: modelId },
      });

      if (!model) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found",
        });
      }

      // Create the contract
      const contract = await ctx.prisma.contract.create({
        data: {
          modelId,
          managerId,
          documentUrl,
          status: "PENDING",
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return contract;
    }),

  /**
   * Get contracts by model ID
   * Models can only see their own contracts
   * Managers can see contracts they created
   * Admins can see all contracts
   */
  getContractsByModel: protectedProcedure
    .input(
      z.object({
        modelId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
        status: z.enum(["PENDING", "SIGNED", "REJECTED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { modelId, limit, offset, status } = input;
      const { userId, user } = ctx;

      // Build the where clause based on role and inputs
      let where: any = {};

      // For normal users, they can only see their own contracts as a model
      if (user?.role === "USER") {
        where.modelId = userId;
      }
      // For managers, they can see contracts they created or for models they manage
      else if (user?.role === "MANAGER") {
        where.OR = [
          { managerId: userId },
          { modelId: userId },
        ];
        
        // If modelId is specified, add additional filter
        if (modelId) {
          where = {
            AND: [
              where,
              { modelId },
            ],
          };
        }
      }
      // For admins, they can see all contracts or filter by modelId
      else if (modelId) {
        where.modelId = modelId;
      }

      // Add status filter if provided
      if (status) {
        where.status = status;
      }

      // Get contracts with pagination
      const [contracts, total] = await Promise.all([
        ctx.prisma.contract.findMany({
          where,
          include: {
            model: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.contract.count({ where }),
      ]);

      return {
        contracts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get a single contract by ID
   */
  getContract: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;

      const contract = await ctx.prisma.contract.findUnique({
        where: { id },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // Check permissions:
      // 1. User is an admin (no additional checks)
      // 2. User is the model in the contract
      // 3. User is the manager in the contract
      if (
        user?.role !== "ADMIN" &&
        contract.modelId !== userId &&
        contract.managerId !== userId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this contract",
        });
      }

      return contract;
    }),

  /**
   * Update contract status
   * Only the model can sign or reject
   * When status is set to SIGNED, also set signedAt timestamp
   */
  updateContractStatus: protectedProcedure
    .input(ContractUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      const { userId, user } = ctx;

      // Find the contract
      const contract = await ctx.prisma.contract.findUnique({
        where: { id },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // Check permissions:
      // 1. User is an admin (can update any contract)
      // 2. User is the model in the contract (can sign/reject their own contracts)
      if (user?.role !== "ADMIN" && contract.modelId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the model or an admin can update the contract status",
        });
      }

      // Prevent updating already signed or rejected contracts
      if (contract.status !== "PENDING" && user?.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot update a contract with status ${contract.status}`,
        });
      }

      // Update the contract
      const updateData: any = { status };
      
      // When signing, set the signedAt timestamp
      if (status === "SIGNED") {
        updateData.signedAt = new Date();
      }

      const updatedContract = await ctx.prisma.contract.update({
        where: { id },
        data: updateData,
        include: {
          model: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedContract;
    }),

  /**
   * Get contracts by manager ID
   * Only managers and admins can access this endpoint
   */
  getContractsByManager: managerProcedure
    .input(
      z.object({
        managerId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
        status: z.enum(["PENDING", "SIGNED", "REJECTED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { managerId, limit, offset, status } = input;
      const { userId, user } = ctx;

      // Build the where clause based on role and inputs
      let where: any = {};

      // For managers, they can only see contracts they created
      if (user?.role === "MANAGER") {
        where.managerId = userId;
      } 
      // For admins, they can filter by managerId or see all
      else if (managerId) {
        where.managerId = managerId;
      }

      // Add status filter if provided
      if (status) {
        where.status = status;
      }

      // Get contracts with pagination
      const [contracts, total] = await Promise.all([
        ctx.prisma.contract.findMany({
          where,
          include: {
            model: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.contract.count({ where }),
      ]);

      return {
        contracts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
}); 