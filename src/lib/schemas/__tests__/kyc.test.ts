import {
  kycReviewSchema,
  approveKycReviewSchema,
  rejectKycReviewSchema,
  requestAdditionalInfoSchema,
  KycReviewRead,
  KycReviewUpdate,
  KycReviewCreate
} from '../kyc';

describe('KYC Schema Validation', () => {
  describe('kycReviewSchema', () => {
    it('should validate a valid KYC review', () => {
      const validReview = {
        id: 'clz1234test',
        profileId: 'profile123',
        reviewerId: 'reviewer123',
        status: 'PENDING' as const,
        reason: 'Test reason',
        rejectionReason: null,
        documentUrls: ['https://example.com/doc1.pdf'],
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = kycReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should validate with nullable or optional fields', () => {
      const review = {
        id: 'clz1234test',
        profileId: 'profile123',
        reviewerId: null,
        status: 'PENDING' as const,
        reason: null,
        rejectionReason: null,
        documentUrls: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = kycReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status values', () => {
      const invalidReview = {
        id: 'clz1234test',
        profileId: 'profile123',
        reviewerId: 'reviewer123',
        status: 'INVALID_STATUS',
        reason: 'Test reason',
        rejectionReason: null,
        documentUrls: ['https://example.com/doc1.pdf'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = kycReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it('should require documentUrls to be valid URLs', () => {
      const invalidReview = {
        id: 'clz1234test',
        profileId: 'profile123',
        reviewerId: 'reviewer123',
        status: 'PENDING' as const,
        reason: 'Test reason',
        rejectionReason: null,
        documentUrls: ['invalid-url'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = kycReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });
  });

  describe('approveKycReviewSchema', () => {
    it('should validate a valid approval input', () => {
      const validApproval = {
        id: 'review123',
        reason: 'Approved with all requirements met',
      };

      const result = approveKycReviewSchema.safeParse(validApproval);
      expect(result.success).toBe(true);
    });

    it('should validate with optional reason', () => {
      const validApproval = {
        id: 'review123',
      };

      const result = approveKycReviewSchema.safeParse(validApproval);
      expect(result.success).toBe(true);
    });

    it('should reject without id', () => {
      const invalidApproval = {
        reason: 'Missing id',
      };

      const result = approveKycReviewSchema.safeParse(invalidApproval);
      expect(result.success).toBe(false);
    });
  });

  describe('rejectKycReviewSchema', () => {
    it('should validate a valid rejection input', () => {
      const validRejection = {
        id: 'review123',
        rejectionReason: 'Documents expired',
        reason: 'Additional context about rejection',
      };

      const result = rejectKycReviewSchema.safeParse(validRejection);
      expect(result.success).toBe(true);
    });

    it('should validate without optional reason', () => {
      const validRejection = {
        id: 'review123',
        rejectionReason: 'Documents expired',
      };

      const result = rejectKycReviewSchema.safeParse(validRejection);
      expect(result.success).toBe(true);
    });

    it('should reject without rejectionReason', () => {
      const invalidRejection = {
        id: 'review123',
        reason: 'Missing rejection reason',
      };

      const result = rejectKycReviewSchema.safeParse(invalidRejection);
      expect(result.success).toBe(false);
    });

    it('should reject with empty rejectionReason', () => {
      const invalidRejection = {
        id: 'review123',
        rejectionReason: '',
      };

      const result = rejectKycReviewSchema.safeParse(invalidRejection);
      expect(result.success).toBe(false);
    });
  });

  describe('requestAdditionalInfoSchema', () => {
    it('should validate a valid request for additional info', () => {
      const validRequest = {
        id: 'review123',
        reason: 'Please provide updated identification documents',
        documentTypes: ['IDENTIFICATION', 'ADDRESS_PROOF'],
      };

      const result = requestAdditionalInfoSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate without optional documentTypes', () => {
      const validRequest = {
        id: 'review123',
        reason: 'Please provide additional documents',
      };

      const result = requestAdditionalInfoSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject without reason', () => {
      const invalidRequest = {
        id: 'review123',
      };

      const result = requestAdditionalInfoSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject with empty reason', () => {
      const invalidRequest = {
        id: 'review123',
        reason: '',
      };

      const result = requestAdditionalInfoSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('KycReviewUpdate schema', () => {
    it('should validate a valid update input with all fields', () => {
      const validUpdate = {
        id: 'review123',
        status: 'approved' as const,
        reason: 'All documents verified',
      };

      const result = KycReviewUpdate.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a valid update input with uppercase status', () => {
      const validUpdate = {
        id: 'review123',
        status: 'APPROVED' as const,
      };

      const result = KycReviewUpdate.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidUpdate = {
        id: 'review123',
        status: 'invalid' as any,
      };

      const result = KycReviewUpdate.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('KycReviewRead schema', () => {
    it('should validate a complete review read object', () => {
      const validRead = {
        id: 'review123',
        profileId: 'profile123',
        reviewerId: 'reviewer123',
        status: 'approved' as const,
        reason: 'All documents verified',
        rejectionReason: null,
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = KycReviewRead.safeParse(validRead);
      expect(result.success).toBe(true);
    });

    it('should validate with uppercase status', () => {
      const validRead = {
        id: 'review123',
        profileId: 'profile123',
        reviewerId: null,
        status: 'APPROVED' as const,
        reason: null,
        rejectionReason: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = KycReviewRead.safeParse(validRead);
      expect(result.success).toBe(true);
    });
  });

  describe('KycReviewCreate schema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        profileId: 'profile123',
      };

      const result = KycReviewCreate.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it('should reject without profileId', () => {
      const invalidCreate = {} as any;

      const result = KycReviewCreate.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });
}); 