import { z } from 'zod';

/**
 * Schema for email-based registration
 */
export const RegisterEmailSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  passwordConfirm: z.string(),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});

/**
 * Schema for OTP-based registration (email only, OTP sent separately)
 */
export const RegisterOTPSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Schema for OTP verification
 */
export const VerifyOTPSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

/**
 * Schema for email and password login
 */
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Schema for OTP login (step 1: request OTP)
 */
export const RequestOTPSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Schema for token refresh
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Schema for password reset request
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Schema for password reset confirmation
 */
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  passwordConfirm: z.string(),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});

// Types derived from schemas
export type RegisterEmailRequest = z.infer<typeof RegisterEmailSchema>;
export type RegisterOTPRequest = z.infer<typeof RegisterOTPSchema>;
export type VerifyOTPRequest = z.infer<typeof VerifyOTPSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RequestOTPRequest = z.infer<typeof RequestOTPSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type PasswordResetRequestRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetSchema>; 