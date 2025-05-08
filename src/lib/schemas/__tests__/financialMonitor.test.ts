import { describe, it, expect } from 'vitest';
import {
  FinancialMetricSchema,
  GetFinancialTrendsSchema,
  AddFinancialMetricSchema,
  FinancialSummarySchema,
} from '@/lib/schemas/financialMonitor';

describe('FinancialMonitor Schemas', () => {
  describe('FinancialMetricSchema', () => {
    it('should validate a valid financial metric', () => {
      const validMetric = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        clientId: 'client-456',
        category: 'revenue',
        amount: 1000.50,
        currency: 'USD',
        date: new Date(),
        description: 'Monthly subscription',
        trend: 5.25,
        variance: -2.5,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          name: 'John Doe',
        },
        client: {
          id: 'client-456',
          name: 'ABC Corp',
        },
      };

      expect(() => FinancialMetricSchema.parse(validMetric)).not.toThrow();
    });

    it('should validate a metric with null userId and clientId', () => {
      const validMetric = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        clientId: null,
        category: 'expense',
        amount: 500.75,
        currency: 'USD',
        date: new Date(),
        createdAt: new Date(),
      };

      expect(() => FinancialMetricSchema.parse(validMetric)).not.toThrow();
    });

    it('should validate a metric without optional fields', () => {
      const validMetric = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'revenue',
        amount: 1000,
        date: new Date(),
        createdAt: new Date(),
      };

      expect(() => FinancialMetricSchema.parse(validMetric)).not.toThrow();
    });

    it('should reject a metric with invalid id format', () => {
      const invalidMetric = {
        id: 'not-a-uuid',
        category: 'revenue',
        amount: 1000,
        date: new Date(),
        createdAt: new Date(),
      };

      expect(() => FinancialMetricSchema.parse(invalidMetric)).toThrow();
    });

    it('should reject a metric with missing required fields', () => {
      const invalidMetric = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        // missing category
        amount: 1000,
        // missing date
        createdAt: new Date(),
      };

      expect(() => FinancialMetricSchema.parse(invalidMetric)).toThrow();
    });
  });

  describe('GetFinancialTrendsSchema', () => {
    it('should validate valid query parameters', () => {
      const validParams = {
        userId: 'user-123',
        clientId: 'client-456',
        category: 'revenue',
        startDate: new Date(),
        endDate: new Date(),
        groupBy: 'month' as const,
        includeTrend: true,
        includeVariance: false,
      };

      expect(() => GetFinancialTrendsSchema.parse(validParams)).not.toThrow();
    });

    it('should use default values for groupBy and analysis flags', () => {
      const params = {
        userId: 'user-123',
      };

      const result = GetFinancialTrendsSchema.parse(params);
      expect(result.groupBy).toBe('month');
      expect(result.includeTrend).toBe(true);
      expect(result.includeVariance).toBe(true);
    });

    it('should reject invalid groupBy value', () => {
      const invalidParams = {
        groupBy: 'invalid',
      };

      expect(() => GetFinancialTrendsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('AddFinancialMetricSchema', () => {
    it('should validate valid financial metric creation', () => {
      const validMetricData = {
        userId: 'user-123',
        clientId: 'client-456',
        category: 'revenue',
        amount: 1000.50,
        currency: 'EUR',
        date: new Date(),
        description: 'Monthly subscription',
      };

      expect(() => AddFinancialMetricSchema.parse(validMetricData)).not.toThrow();
    });

    it('should validate metric creation with default values', () => {
      const validMetricData = {
        category: 'expense',
        amount: 500,
      };

      const result = AddFinancialMetricSchema.parse(validMetricData);
      expect(result.currency).toBe('USD');
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should validate metric creation with null IDs', () => {
      const validMetricData = {
        userId: null,
        clientId: null,
        category: 'expense',
        amount: 500,
      };

      expect(() => AddFinancialMetricSchema.parse(validMetricData)).not.toThrow();
    });

    it('should reject metric creation with missing required fields', () => {
      const invalidMetricData = {
        userId: 'user-123',
        // missing category
        amount: 1000,
      };

      expect(() => AddFinancialMetricSchema.parse(invalidMetricData)).toThrow();
    });

    it('should reject metric creation with invalid amount', () => {
      const invalidMetricData = {
        category: 'revenue',
        amount: 'not-a-number',
      };

      expect(() => AddFinancialMetricSchema.parse(invalidMetricData)).toThrow();
    });
  });

  describe('FinancialSummarySchema', () => {
    it('should validate a valid financial summary', () => {
      const validSummary = {
        totalRevenue: 5000,
        totalExpenses: 3000,
        netProfit: 2000,
        topCategories: [
          { category: 'subscription', amount: 3000, percentage: 60 },
          { category: 'one-time', amount: 2000, percentage: 40 },
        ],
        monthlyTrend: [
          { month: '2023-01', revenue: 1000, expenses: 800, profit: 200 },
          { month: '2023-02', revenue: 1200, expenses: 900, profit: 300 },
        ],
      };

      expect(() => FinancialSummarySchema.parse(validSummary)).not.toThrow();
    });

    it('should reject a summary with invalid numeric values', () => {
      const invalidSummary = {
        totalRevenue: '5000', // Should be a number
        totalExpenses: 3000,
        netProfit: 2000,
        topCategories: [],
        monthlyTrend: [],
      };

      expect(() => FinancialSummarySchema.parse(invalidSummary)).toThrow();
    });

    it('should reject a summary with invalid category data', () => {
      const invalidSummary = {
        totalRevenue: 5000,
        totalExpenses: 3000,
        netProfit: 2000,
        topCategories: [
          { category: 'subscription', amount: 3000 }, // Missing percentage
        ],
        monthlyTrend: [],
      };

      expect(() => FinancialSummarySchema.parse(invalidSummary)).toThrow();
    });

    it('should reject a summary with invalid trend data', () => {
      const invalidSummary = {
        totalRevenue: 5000,
        totalExpenses: 3000,
        netProfit: 2000,
        topCategories: [],
        monthlyTrend: [
          { month: '2023-01', revenue: 1000 }, // Missing expenses and profit
        ],
      };

      expect(() => FinancialSummarySchema.parse(invalidSummary)).toThrow();
    });
  });
}); 