import { 
  organizationSettingsSchema, 
  referralSettingsSchema,
  updateOrganizationSettingsSchema,
  updateReferralCodeSchema,
  OrgSettingsSchema,
  GenerateReferralCodeSchema,
  ReferralCodeResponseSchema,
  ClientWithOrgDataSchema,
  DEFAULT_ORG_SETTINGS
} from '../organization';

describe('Organization Schemas', () => {
  describe('organizationSettingsSchema', () => {
    it('should validate valid organization settings', () => {
      const validSettings = {
        displayName: 'My Organization',
        logo: 'https://example.com/logo.png',
        primaryColor: '#4f46e5',
        secondaryColor: '#f97316',
        contactEmail: 'contact@example.com',
        supportPhone: '+1234567890',
        timezone: 'America/New_York',
        defaultLanguage: 'en',
        socialLinks: {
          twitter: 'https://twitter.com/example',
          instagram: 'https://instagram.com/example',
        },
      };

      const result = organizationSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should reject invalid color formats', () => {
      const invalidSettings = {
        primaryColor: 'not-a-color',
      };

      const result = organizationSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidSettings = {
        contactEmail: 'not-an-email',
      };

      const result = organizationSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('referralSettingsSchema', () => {
    it('should validate valid referral settings', () => {
      const validSettings = {
        referralCode: 'REF123',
        referralBonus: 10.5,
        referralPeriodDays: 30,
        maxReferrals: 100,
        termsAccepted: true,
      };

      const result = referralSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should reject negative bonus values', () => {
      const invalidSettings = {
        referralBonus: -10,
      };

      const result = referralSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject referral codes that are too short', () => {
      const invalidSettings = {
        referralCode: 'AB',
      };

      const result = referralSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrganizationSettingsSchema', () => {
    it('should validate valid update request', () => {
      const validUpdate = {
        clientId: 'client-123',
        settings: {
          displayName: 'Updated Organization',
          primaryColor: '#123456',
        },
      };

      const result = updateOrganizationSettingsSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should require clientId', () => {
      const invalidUpdate = {
        settings: {
          displayName: 'Updated Organization',
        },
      };

      const result = updateOrganizationSettingsSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('updateReferralCodeSchema', () => {
    it('should validate valid referral code update', () => {
      const validUpdate = {
        clientId: 'client-123',
        referralCode: 'NEWCODE123',
      };

      const result = updateReferralCodeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow null referral code', () => {
      const validUpdate = {
        clientId: 'client-123',
        referralCode: null,
      };

      const result = updateReferralCodeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject referral codes that are too long', () => {
      const invalidUpdate = {
        clientId: 'client-123',
        referralCode: 'THIS_CODE_IS_WAY_TOO_LONG_FOR_THE_SCHEMA',
      };

      const result = updateReferralCodeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('DEFAULT_ORG_SETTINGS', () => {
    it('should have all required default settings', () => {
      expect(DEFAULT_ORG_SETTINGS).toHaveProperty('branding');
      expect(DEFAULT_ORG_SETTINGS).toHaveProperty('features');
      expect(DEFAULT_ORG_SETTINGS).toHaveProperty('communication');
      expect(DEFAULT_ORG_SETTINGS).toHaveProperty('privacy');
      expect(DEFAULT_ORG_SETTINGS).toHaveProperty('billing');
    });

    it('should have valid default colors', () => {
      expect(DEFAULT_ORG_SETTINGS.branding.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(DEFAULT_ORG_SETTINGS.branding.secondaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
}); 