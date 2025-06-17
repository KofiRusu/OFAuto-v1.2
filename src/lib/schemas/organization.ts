import { z } from 'zod';

/**
 * Schema for organization settings
 */
export const OrgSettingsSchema = z.object({
  clientId: z.string().uuid(),
  settings: z.record(z.unknown()).default({}),
});

export type OrgSettings = z.infer<typeof OrgSettingsSchema>;

/**
 * Schema for generating a referral code
 */
export const GenerateReferralCodeSchema = z.object({
  clientId: z.string().uuid(),
});

export type GenerateReferralCode = z.infer<typeof GenerateReferralCodeSchema>;

/**
 * Schema for referral code response
 */
export const ReferralCodeResponseSchema = z.object({
  referralCode: z.string(),
  clientId: z.string().uuid(),
});

export type ReferralCodeResponse = z.infer<typeof ReferralCodeResponseSchema>;

/**
 * Schema for clients with organization data
 */
export const ClientWithOrgDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  referralCode: z.string().nullable(),
  orgSettings: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClientWithOrgData = z.infer<typeof ClientWithOrgDataSchema>;

/**
 * Default organization settings
 * Used when creating new clients or when no settings exist
 */
export const DEFAULT_ORG_SETTINGS = {
  branding: {
    primaryColor: '#4f46e5', // Indigo
    secondaryColor: '#f97316', // Orange
    logoUrl: null,
    favicon: null,
  },
  features: {
    enableReferrals: true,
    enableActivityLogs: true,
    enablePerformanceReports: true,
    enableNotifications: true,
  },
  communication: {
    emailFooter: 'Powered by OFAuto',
    emailReplyTo: null,
    notificationPreferences: {
      email: true,
      inApp: true,
    },
  },
  privacy: {
    dataSharingEnabled: false,
    retentionPeriodDays: 365,
  },
  billing: {
    paymentTerms: 'net30',
    taxRate: 0,
  },
};

// Schema for basic organization settings
export const organizationSettingsSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  contactEmail: z.string().email().optional(),
  supportPhone: z.string().optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    tiktok: z.string().url().optional(),
  }).optional(),
});

// Schema for referral settings
export const referralSettingsSchema = z.object({
  referralCode: z.string().min(3).max(20).optional(),
  referralBonus: z.number().min(0).optional(),
  referralPeriodDays: z.number().int().min(0).optional(),
  maxReferrals: z.number().int().min(0).optional(),
  termsAccepted: z.boolean().optional(),
});

// Schema for update organization settings
export const updateOrganizationSettingsSchema = z.object({
  clientId: z.string(),
  settings: organizationSettingsSchema,
});

// Schema for update referral code
export const updateReferralCodeSchema = z.object({
  clientId: z.string(),
  referralCode: z.string().min(3).max(20).nullable(),
}); 