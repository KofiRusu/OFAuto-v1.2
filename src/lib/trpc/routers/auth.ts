import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc/trpc';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
  LoginSchema, 
  RegisterEmailSchema, 
  RegisterOTPSchema, 
  RequestOTPSchema, 
  VerifyOTPSchema,
  RefreshTokenSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema
} from '@/lib/schemas/auth';
import { randomBytes } from 'crypto';
import { env } from '@/lib/env';
import { UserRole } from '@prisma/client';

/**
 * Authentication router
 * Handles user registration, login, and session management
 */
export const authRouter = createTRPCRouter({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(RegisterEmailSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, email, password } = input;
      const { logger } = ctx;

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.MODEL, // Default role for new users
          },
        });

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id, tokenVersion: 1 },
          env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        logger.info('User registered successfully', { userId: user.id });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        };
      } catch (error) {
        logger.error('Registration failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register user',
          cause: error,
        });
      }
    }),

  /**
   * Request OTP for registration
   */
  requestRegistrationOTP: publicProcedure
    .input(RegisterOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, email } = input;
      const { logger } = ctx;

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP
        await prisma.otpCode.upsert({
          where: { email },
          update: {
            code: otp,
            expiresAt: otpExpiry,
            name, // Update name if changed
          },
          create: {
            email,
            name,
            code: otp,
            expiresAt: otpExpiry,
            type: 'REGISTRATION',
          },
        });

        // In production, send email with OTP
        // For development, return the OTP directly (not secure for production)
        logger.info('OTP generated for registration', { email });

        return {
          success: true,
          message: 'OTP sent to email',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        };
      } catch (error) {
        logger.error('OTP generation failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate OTP',
          cause: error,
        });
      }
    }),

  /**
   * Verify OTP and complete registration
   */
  verifyRegistrationOTP: publicProcedure
    .input(VerifyOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, code } = input;
      const { logger } = ctx;

      try {
        // Find OTP record
        const otpRecord = await prisma.otpCode.findUnique({
          where: { email, type: 'REGISTRATION' },
        });

        if (!otpRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'OTP not found',
          });
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OTP has expired',
          });
        }

        // Verify OTP
        if (otpRecord.code !== code) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid OTP',
          });
        }

        // Create user with random password (user will need to set password later)
        const tempPassword = randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: otpRecord.name,
            email,
            password: hashedPassword,
            role: UserRole.MODEL, // Default role for new users
          },
        });

        // Delete OTP record
        await prisma.otpCode.delete({
          where: { id: otpRecord.id },
        });

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id, tokenVersion: 1 },
          env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        logger.info('User registered with OTP', { userId: user.id });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
          passwordResetRequired: true,
        };
      } catch (error) {
        logger.error('OTP verification failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify OTP',
          cause: error,
        });
      }
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password, rememberMe } = input;
      const { logger } = ctx;

      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password);

        if (!passwordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: rememberMe ? '1d' : '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id, tokenVersion: user.tokenVersion || 1 },
          env.JWT_SECRET,
          { expiresIn: rememberMe ? '30d' : '7d' }
        );

        logger.info('User logged in', { userId: user.id });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        };
      } catch (error) {
        logger.error('Login failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to login',
          cause: error,
        });
      }
    }),

  /**
   * Request OTP for login
   */
  requestLoginOTP: publicProcedure
    .input(RequestOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const { logger } = ctx;

      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // For security, don't reveal that user doesn't exist
          // Still return success but don't send OTP
          return {
            success: true,
            message: 'If an account with this email exists, an OTP has been sent',
          };
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP
        await prisma.otpCode.upsert({
          where: { email },
          update: {
            code: otp,
            expiresAt: otpExpiry,
          },
          create: {
            email,
            name: user.name,
            code: otp,
            expiresAt: otpExpiry,
            type: 'LOGIN',
          },
        });

        // In production, send email with OTP
        // For development, return the OTP directly (not secure for production)
        logger.info('OTP generated for login', { email });

        return {
          success: true,
          message: 'OTP sent to email',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        };
      } catch (error) {
        logger.error('OTP generation failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate OTP',
          cause: error,
        });
      }
    }),

  /**
   * Verify OTP and login
   */
  verifyLoginOTP: publicProcedure
    .input(VerifyOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, code } = input;
      const { logger } = ctx;

      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Find OTP record
        const otpRecord = await prisma.otpCode.findUnique({
          where: { email, type: 'LOGIN' },
        });

        if (!otpRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'OTP not found',
          });
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OTP has expired',
          });
        }

        // Verify OTP
        if (otpRecord.code !== code) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid OTP',
          });
        }

        // Delete OTP record
        await prisma.otpCode.delete({
          where: { id: otpRecord.id },
        });

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id, tokenVersion: user.tokenVersion || 1 },
          env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        logger.info('User logged in with OTP', { userId: user.id });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        };
      } catch (error) {
        logger.error('OTP verification failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify OTP',
          cause: error,
        });
      }
    }),

  /**
   * Refresh access token
   */
  refresh: publicProcedure
    .input(RefreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const { refreshToken } = input;
      const { logger } = ctx;

      try {
        // Verify refresh token
        const payload = jwt.verify(refreshToken, env.JWT_SECRET) as {
          userId: string;
          tokenVersion?: number;
        };

        // Find user
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Check token version
        if (user.tokenVersion !== payload.tokenVersion) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid refresh token',
          });
        }

        // Generate new access token
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        logger.info('Token refreshed', { userId: user.id });

        return {
          accessToken,
        };
      } catch (error) {
        logger.error('Token refresh failed', { error });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
          cause: error,
        });
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(PasswordResetRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const { logger } = ctx;

      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // For security, don't reveal that user doesn't exist
          return {
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent',
          };
        }

        // Generate reset token
        const token = randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token
        await prisma.passwordReset.upsert({
          where: { userId: user.id },
          update: {
            token,
            expiresAt: tokenExpiry,
          },
          create: {
            userId: user.id,
            token,
            expiresAt: tokenExpiry,
          },
        });

        // In production, send email with reset link
        // For development, return the token directly (not secure for production)
        logger.info('Password reset requested', { userId: user.id });

        return {
          success: true,
          message: 'Password reset link sent to email',
          token: process.env.NODE_ENV === 'development' ? token : undefined,
        };
      } catch (error) {
        logger.error('Password reset request failed', { error, email });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to request password reset',
          cause: error,
        });
      }
    }),

  /**
   * Reset password
   */
  resetPassword: publicProcedure
    .input(PasswordResetSchema)
    .mutation(async ({ input, ctx }) => {
      const { token, password } = input;
      const { logger } = ctx;

      try {
        // Find token
        const resetRecord = await prisma.passwordReset.findFirst({
          where: { token },
        });

        if (!resetRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid or expired token',
          });
        }

        // Check if token is expired
        if (resetRecord.expiresAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Token has expired',
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and increment token version
        const user = await prisma.user.update({
          where: { id: resetRecord.userId },
          data: {
            password: hashedPassword,
            tokenVersion: {
              increment: 1,
            },
          },
        });

        // Delete reset record
        await prisma.passwordReset.delete({
          where: { id: resetRecord.id },
        });

        logger.info('Password reset successful', { userId: user.id });

        return {
          success: true,
          message: 'Password reset successful',
        };
      } catch (error) {
        logger.error('Password reset failed', { error });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
          cause: error,
        });
      }
    }),

  /**
   * Get current user
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const { auth } = ctx;

      try {
        const user = await prisma.user.findUnique({
          where: { id: auth.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user information',
          cause: error,
        });
      }
    }),

  /**
   * Logout user (invalidate tokens)
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { auth, logger } = ctx;

      try {
        // Increment token version to invalidate all existing refresh tokens
        await prisma.user.update({
          where: { id: auth.userId },
          data: {
            tokenVersion: {
              increment: 1,
            },
          },
        });

        logger.info('User logged out', { userId: auth.userId });

        return {
          success: true,
          message: 'Logged out successfully',
        };
      } catch (error) {
        logger.error('Logout failed', { error, userId: auth.userId });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to logout',
          cause: error,
        });
      }
    }),
}); 