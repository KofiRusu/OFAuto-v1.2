import { describe, it, expect } from 'vitest';
import {
  KycTypeEnum,
  KycStatusEnum,
  KycDocumentCreateSchema,
  KycDocumentUpdateSchema,
} from '../kycDocument';

describe('KycTypeEnum', () => {
  it('should validate valid KYC document types', () => {
    expect(KycTypeEnum.safeParse('ID_FRONT').success).toBe(true);
    expect(KycTypeEnum.safeParse('ID_BACK').success).toBe(true);
    expect(KycTypeEnum.safeParse('TAX_FORM').success).toBe(true);
  });

  it('should reject invalid KYC document types', () => {
    expect(KycTypeEnum.safeParse('INVALID_TYPE').success).toBe(false);
    expect(KycTypeEnum.safeParse('').success).toBe(false);
    expect(KycTypeEnum.safeParse(null).success).toBe(false);
  });
});

describe('KycStatusEnum', () => {
  it('should validate valid KYC document statuses', () => {
    expect(KycStatusEnum.safeParse('PENDING').success).toBe(true);
    expect(KycStatusEnum.safeParse('APPROVED').success).toBe(true);
    expect(KycStatusEnum.safeParse('REJECTED').success).toBe(true);
    expect(KycStatusEnum.safeParse('NEEDS_INFO').success).toBe(true);
  });

  it('should reject invalid KYC document statuses', () => {
    expect(KycStatusEnum.safeParse('INVALID_STATUS').success).toBe(false);
    expect(KycStatusEnum.safeParse('').success).toBe(false);
    expect(KycStatusEnum.safeParse(null).success).toBe(false);
  });
});

describe('KycDocumentCreateSchema', () => {
  it('should validate a valid KYC document creation payload', () => {
    const validData = {
      userId: 'user-123',
      type: 'ID_FRONT',
      fileUrl: 'https://example.com/document.pdf',
    };

    const result = KycDocumentCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty userId', () => {
    const invalidData = {
      userId: '',
      type: 'ID_FRONT',
      fileUrl: 'https://example.com/document.pdf',
    };

    const result = KycDocumentCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('userId');
    }
  });

  it('should reject invalid document type', () => {
    const invalidData = {
      userId: 'user-123',
      type: 'INVALID_TYPE',
      fileUrl: 'https://example.com/document.pdf',
    };

    const result = KycDocumentCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('type');
    }
  });

  it('should reject invalid file URL', () => {
    const invalidData = {
      userId: 'user-123',
      type: 'ID_FRONT',
      fileUrl: 'not-a-url',
    };

    const result = KycDocumentCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('fileUrl');
    }
  });

  it('should reject missing required fields', () => {
    const emptyData = {};
    const result = KycDocumentCreateSchema.safeParse(emptyData);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('KycDocumentUpdateSchema', () => {
  it('should validate a valid document update with required fields', () => {
    const validData = {
      id: 'doc-123',
      status: 'APPROVED',
      reviewerId: 'reviewer-123',
    };

    const result = KycDocumentUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate a valid document update with optional notes', () => {
    const validData = {
      id: 'doc-123',
      status: 'REJECTED',
      reviewerId: 'reviewer-123',
      notes: 'Document is blurry and unreadable',
    };

    const result = KycDocumentUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate a valid document update with reviewedAt date', () => {
    const validData = {
      id: 'doc-123',
      status: 'APPROVED',
      reviewerId: 'reviewer-123',
      reviewedAt: new Date(),
    };

    const result = KycDocumentUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty document id', () => {
    const invalidData = {
      id: '',
      status: 'APPROVED',
      reviewerId: 'reviewer-123',
    };

    const result = KycDocumentUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('id');
    }
  });

  it('should reject invalid status', () => {
    const invalidData = {
      id: 'doc-123',
      status: 'INVALID_STATUS',
      reviewerId: 'reviewer-123',
    };

    const result = KycDocumentUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('status');
    }
  });

  it('should reject empty reviewerId', () => {
    const invalidData = {
      id: 'doc-123',
      status: 'APPROVED',
      reviewerId: '',
    };

    const result = KycDocumentUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('reviewerId');
    }
  });

  it('should reject invalid reviewedAt date', () => {
    const invalidData = {
      id: 'doc-123',
      status: 'APPROVED',
      reviewerId: 'reviewer-123',
      reviewedAt: 'not-a-date',
    };

    const result = KycDocumentUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('reviewedAt');
    }
  });
}); 