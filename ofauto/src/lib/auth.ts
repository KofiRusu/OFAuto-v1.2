import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import prisma from './prisma';

export async function getCurrentUser(req: NextRequest) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return null;
  }
  
  // Find the user in our database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });
  
  return user;
}

export async function ensureUserExists(req: NextRequest) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return null;
  }
  
  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });
  
  // If user doesn't exist, create them
  if (!user) {
    // You'd typically get more user info from Clerk here
    // For now, we'll create a basic user
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: 'placeholder@example.com', // This would come from Clerk
        name: 'New User', // This would come from Clerk
      }
    });
  }
  
  return user;
} 