import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { logger } from '@/lib/telemetry/logger';

const tracer = trace.getTracer('trpc-server');

/**
 * Context type for tRPC
 */
export const createTRPCContext = async () => {
  const { userId } = auth();
  
  // Create context with user info
  return {
    userId,
    prisma,
    // Get user with role info if authenticated
    user: userId ? await getUserWithRole(userId) : null,
    // Add logger to context
    logger,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Helper function to get user with role
 */
const getUserWithRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, name: true }
  });
  
  return user;
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * OpenTelemetry tracing middleware
 */
const openTelemetryMiddleware = t.middleware(async ({ path, type, next }) => {
  return tracer.startActiveSpan(`trpc.${type}.${path}`, async (span) => {
    try {
      // Execute the procedure
      const result = await next();
      
      // Record successful execution
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      // Record error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      
      // Add error attributes
      if (error instanceof TRPCError) {
        span.setAttribute('trpc.error.code', error.code);
        span.setAttribute('trpc.error.message', error.message);
      }
      
      // Rethrow the error
      throw error;
    } finally {
      // End the span
      span.end();
    }
  });
});

/**
 * tRPC router builder
 */
export const router = t.router;

/**
 * Public procedure - available to all users
 */
export const publicProcedure = t.procedure.use(openTelemetryMiddleware);

/**
 * Middleware to enforce user is authenticated
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
      logger: ctx.logger.child({ userId: ctx.userId }),
    },
  });
});

/**
 * Protected procedure - only available to authenticated users
 */
export const protectedProcedure = publicProcedure.use(enforceAuth);

/**
 * Middleware to enforce specific user roles
 */
const enforceUserRole = (allowedRoles: UserRole[]) => 
  t.middleware(({ ctx, next }) => {
    if (!ctx.userId || !ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ 
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      });
    }
    
    return next({
      ctx: {
        userId: ctx.userId,
        user: ctx.user,
        logger: ctx.logger.child({ userId: ctx.userId, role: ctx.user.role }),
      },
    });
  });

/**
 * Admin procedure - only available to admin users
 */
export const adminProcedure = protectedProcedure.use(
  enforceUserRole([UserRole.ADMIN])
);

/**
 * Manager procedure - available to admin and manager users
 */
export const managerProcedure = protectedProcedure.use(
  enforceUserRole([UserRole.ADMIN, UserRole.MANAGER])
); 