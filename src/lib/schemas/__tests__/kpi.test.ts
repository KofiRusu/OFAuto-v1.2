import {
  KpiCreateSchema,
  KpiUpdateSchema,
  KpiResponseSchema,
  KpiListSchema,
  KpiDeleteSchema,
} from '../kpi';

describe('KPI Schema Validation', () => {
  describe('KpiCreateSchema', () => {
    it('should validate a valid KPI creation payload', () => {
      const validKpiCreate = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        dueDate: new Date('2024-12-31'),
      };

      const result = KpiCreateSchema.safeParse(validKpiCreate);
      expect(result.success).toBe(true);
    });

    it('should validate without optional dueDate', () => {
      const validKpiCreate = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Monthly Subscribers',
        targetValue: 1000,
      };

      const result = KpiCreateSchema.safeParse(validKpiCreate);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid userId format', () => {
      const invalidKpiCreate = {
        userId: 'not-a-uuid',
        name: 'Monthly Subscribers',
        targetValue: 1000,
      };

      const result = KpiCreateSchema.safeParse(invalidKpiCreate);
      expect(result.success).toBe(false);
    });

    it('should reject with empty name', () => {
      const invalidKpiCreate = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        targetValue: 1000,
      };

      const result = KpiCreateSchema.safeParse(invalidKpiCreate);
      expect(result.success).toBe(false);
    });

    it('should reject with negative targetValue', () => {
      const invalidKpiCreate = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Monthly Subscribers',
        targetValue: -100,
      };

      const result = KpiCreateSchema.safeParse(invalidKpiCreate);
      expect(result.success).toBe(false);
    });

    it('should reject with zero targetValue', () => {
      const invalidKpiCreate = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Monthly Subscribers',
        targetValue: 0,
      };

      const result = KpiCreateSchema.safeParse(invalidKpiCreate);
      expect(result.success).toBe(false);
    });
  });

  describe('KpiUpdateSchema', () => {
    it('should validate a valid full KPI update payload', () => {
      const validKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated KPI Name',
        targetValue: 2000,
        currentValue: 500,
        status: 'IN_PROGRESS',
        dueDate: new Date('2024-12-31'),
      };

      const result = KpiUpdateSchema.safeParse(validKpiUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate with only required id field', () => {
      const validKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = KpiUpdateSchema.safeParse(validKpiUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update', () => {
      const validKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        currentValue: 750,
        status: 'COMPLETED',
      };

      const result = KpiUpdateSchema.safeParse(validKpiUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate with null dueDate', () => {
      const validKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dueDate: null,
      };

      const result = KpiUpdateSchema.safeParse(validKpiUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid id format', () => {
      const invalidKpiUpdate = {
        id: 'not-a-uuid',
        currentValue: 500,
      };

      const result = KpiUpdateSchema.safeParse(invalidKpiUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject with negative currentValue', () => {
      const invalidKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        currentValue: -100,
      };

      const result = KpiUpdateSchema.safeParse(invalidKpiUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject with invalid status', () => {
      const invalidKpiUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'INVALID_STATUS',
      };

      const result = KpiUpdateSchema.safeParse(invalidKpiUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('KpiResponseSchema', () => {
    it('should validate a complete KPI response object', () => {
      const validKpiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        currentValue: 300,
        dueDate: new Date('2024-12-31'),
        status: 'IN_PROGRESS',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = KpiResponseSchema.safeParse(validKpiResponse);
      expect(result.success).toBe(true);
    });

    it('should validate with null dueDate', () => {
      const validKpiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Monthly Subscribers',
        targetValue: 1000,
        currentValue: 300,
        dueDate: null,
        status: 'IN_PROGRESS',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = KpiResponseSchema.safeParse(validKpiResponse);
      expect(result.success).toBe(true);
    });

    it('should reject when missing required fields', () => {
      const invalidKpiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Monthly Subscribers',
        // Missing targetValue
        currentValue: 300,
        dueDate: null,
        status: 'IN_PROGRESS',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = KpiResponseSchema.safeParse(invalidKpiResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('KpiListSchema', () => {
    it('should validate with all optional fields', () => {
      const validKpiList = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'IN_PROGRESS',
      };

      const result = KpiListSchema.safeParse(validKpiList);
      expect(result.success).toBe(true);
    });

    it('should validate with no fields', () => {
      const validKpiList = {};

      const result = KpiListSchema.safeParse(validKpiList);
      expect(result.success).toBe(true);
    });

    it('should validate with only userId', () => {
      const validKpiList = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = KpiListSchema.safeParse(validKpiList);
      expect(result.success).toBe(true);
    });

    it('should validate with only status', () => {
      const validKpiList = {
        status: 'COMPLETED',
      };

      const result = KpiListSchema.safeParse(validKpiList);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid userId format', () => {
      const invalidKpiList = {
        userId: 'not-a-uuid',
      };

      const result = KpiListSchema.safeParse(invalidKpiList);
      expect(result.success).toBe(false);
    });

    it('should reject with invalid status', () => {
      const invalidKpiList = {
        status: 'INVALID_STATUS',
      };

      const result = KpiListSchema.safeParse(invalidKpiList);
      expect(result.success).toBe(false);
    });
  });

  describe('KpiDeleteSchema', () => {
    it('should validate with valid id', () => {
      const validKpiDelete = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = KpiDeleteSchema.safeParse(validKpiDelete);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid id format', () => {
      const invalidKpiDelete = {
        id: 'not-a-uuid',
      };

      const result = KpiDeleteSchema.safeParse(invalidKpiDelete);
      expect(result.success).toBe(false);
    });

    it('should reject without id', () => {
      const invalidKpiDelete = {};

      const result = KpiDeleteSchema.safeParse(invalidKpiDelete);
      expect(result.success).toBe(false);
    });
  });
}); 