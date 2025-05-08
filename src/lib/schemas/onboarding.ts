import { z } from 'zod';

// OnboardingProfile schemas
export const onboardingProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a valid date",
  }),
  taxId: z.string().nullable().optional(),
  identificationUrl: z.string().nullable().optional(),
  identificationVerified: z.boolean().default(false),
  addressVerified: z.boolean().default(false),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'REVIEW']).default('PENDING'),
  kycCompletedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createOnboardingProfileSchema = onboardingProfileSchema.omit({
  id: true,
  identificationVerified: true,
  addressVerified: true,
  kycStatus: true,
  kycCompletedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOnboardingProfileSchema = onboardingProfileSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  });

// BankAccount schemas
export const bankAccountSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountType: z.enum(['CHECKING', 'SAVINGS']),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().min(9, 'Routing number must be at least 9 digits'),
  bankName: z.string().min(1, 'Bank name is required'),
  verified: z.boolean().default(false),
  primary: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createBankAccountSchema = bankAccountSchema.omit({
  id: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBankAccountSchema = bankAccountSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  });

// CommissionSplit schemas
export const commissionSplitSchema = z.object({
  id: z.string().cuid(),
  ownerId: z.string(),
  sharerId: z.string(),
  percentage: z.number().min(0).max(100),
  startDate: z.date().optional().default(() => new Date()),
  endDate: z.date().nullable().optional(),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createCommissionSplitSchema = commissionSplitSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCommissionSplitSchema = commissionSplitSchema
  .partial()
  .omit({
    id: true,
    ownerId: true,
    sharerId: true,
    createdAt: true,
    updatedAt: true,
  });

// Contract schemas
export const contractSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  title: z.string().min(1, 'Contract title is required'),
  documentUrl: z.string().url('Valid document URL is required'),
  signed: z.boolean().default(false),
  signedAt: z.date().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).default('PENDING'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createContractSchema = contractSchema.omit({
  id: true,
  signed: true,
  signedAt: true,
  signatureUrl: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContractSchema = contractSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  });

// Response schemas with additional fields if needed
export const onboardingProfileResponseSchema = onboardingProfileSchema.extend({});
export const bankAccountResponseSchema = bankAccountSchema.extend({});
export const commissionSplitResponseSchema = commissionSplitSchema.extend({
  owner: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
  sharer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
});
export const contractResponseSchema = contractSchema.extend({});

// Export types
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type CreateOnboardingProfile = z.infer<typeof createOnboardingProfileSchema>;
export type UpdateOnboardingProfile = z.infer<typeof updateOnboardingProfileSchema>;
export type OnboardingProfileResponse = z.infer<typeof onboardingProfileResponseSchema>;

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type CreateBankAccount = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccount = z.infer<typeof updateBankAccountSchema>;
export type BankAccountResponse = z.infer<typeof bankAccountResponseSchema>;

export type CommissionSplit = z.infer<typeof commissionSplitSchema>;
export type CreateCommissionSplit = z.infer<typeof createCommissionSplitSchema>;
export type UpdateCommissionSplit = z.infer<typeof updateCommissionSplitSchema>;
export type CommissionSplitResponse = z.infer<typeof commissionSplitResponseSchema>;

export type Contract = z.infer<typeof contractSchema>;
export type CreateContract = z.infer<typeof createContractSchema>;
export type UpdateContract = z.infer<typeof updateContractSchema>;
export type ContractResponse = z.infer<typeof contractResponseSchema>; 