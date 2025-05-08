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