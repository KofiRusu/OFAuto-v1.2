'use server';

import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Verifies that a user has ownership of a client
 * 
 * @param userId The ID of the user to check
 * @param clientId The ID of the client to check ownership for
 * @throws {TRPCError} If the user does not have ownership of the client
 */
export async function verifyClientOwnership(userId: string, clientId: string): Promise<void> {
  try {
    // Query the database to find a client with the given ID that belongs to the user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    // If no client is found, the user does not have ownership
    if (!client) {
      logger.warn({ userId, clientId }, 'User attempted to access a client they do not own');
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this client',
      });
    }

    // If we get here, the user has ownership of the client
    logger.debug({ userId, clientId }, 'User has verified ownership of client');
  } catch (error) {
    // If the error is already a TRPCError, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }

    // Otherwise, log the error and throw a generic error
    logger.error({ error, userId, clientId }, 'Error verifying client ownership');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify client ownership',
    });
  }
} 