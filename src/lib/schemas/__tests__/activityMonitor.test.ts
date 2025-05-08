import { describe, it, expect } from 'vitest';
import {
  ActivityLogSchema,
  GetActivityFeedSchema,
  UserStatsSchema,
  AddActivityLogSchema,
} from '@/lib/schemas/activityMonitor';

describe('ActivityMonitor Schemas', () => {
  describe('ActivityLogSchema', () => {
    it('should validate a valid activity log', () => {
      const validLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date(),
        metadata: { ip: '192.168.1.1', userAgent: 'Chrome' },
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(() => ActivityLogSchema.parse(validLog)).not.toThrow();
    });

    it('should validate a log without metadata', () => {
      const validLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date(),
      };

      expect(() => ActivityLogSchema.parse(validLog)).not.toThrow();
    });

    it('should validate a log with null metadata', () => {
      const validLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date(),
        metadata: null,
      };

      expect(() => ActivityLogSchema.parse(validLog)).not.toThrow();
    });

    it('should reject a log with invalid id format', () => {
      const invalidLog = {
        id: 'not-a-uuid',
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date(),
      };

      expect(() => ActivityLogSchema.parse(invalidLog)).toThrow();
    });

    it('should reject a log with missing required fields', () => {
      const invalidLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        // missing actionType
        description: 'User logged in',
        timestamp: new Date(),
      };

      expect(() => ActivityLogSchema.parse(invalidLog)).toThrow();
    });
  });

  describe('GetActivityFeedSchema', () => {
    it('should validate valid query parameters', () => {
      const validParams = {
        page: 1,
        limit: 20,
        userId: 'user-123',
        actionType: 'LOGIN',
        startDate: new Date(),
        endDate: new Date(),
        sortBy: 'timestamp' as const,
        sortOrder: 'desc' as const,
      };

      expect(() => GetActivityFeedSchema.parse(validParams)).not.toThrow();
    });

    it('should use default values for pagination', () => {
      const params = {
        userId: 'user-123',
      };

      const result = GetActivityFeedSchema.parse(params);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('timestamp');
      expect(result.sortOrder).toBe('desc');
    });

    it('should reject invalid page and limit values', () => {
      const invalidParams = {
        page: 0, // Invalid: page should be >= 1
        limit: 200, // Invalid: limit should be <= 100
      };

      expect(() => GetActivityFeedSchema.parse(invalidParams)).toThrow();
    });

    it('should reject invalid sort parameters', () => {
      const invalidParams = {
        sortBy: 'invalid',
        sortOrder: 'random',
      };

      expect(() => GetActivityFeedSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('UserStatsSchema', () => {
    it('should validate valid user stats', () => {
      const validStats = {
        totalActions: 100,
        actionsByType: {
          LOGIN: 50,
          LOGOUT: 30,
          UPDATE_PROFILE: 20,
        },
        mostRecentAction: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user-123',
          actionType: 'LOGIN',
          description: 'User logged in',
          timestamp: new Date(),
        },
        activityByDay: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 10 },
        ],
      };

      expect(() => UserStatsSchema.parse(validStats)).not.toThrow();
    });

    it('should validate stats without most recent action', () => {
      const validStats = {
        totalActions: 100,
        actionsByType: {
          LOGIN: 50,
          LOGOUT: 30,
          UPDATE_PROFILE: 20,
        },
        activityByDay: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 10 },
        ],
      };

      expect(() => UserStatsSchema.parse(validStats)).not.toThrow();
    });

    it('should reject stats with invalid action counts', () => {
      const invalidStats = {
        totalActions: -10, // Invalid: should be a positive number
        actionsByType: {
          LOGIN: 50,
        },
        activityByDay: [],
      };

      expect(() => UserStatsSchema.parse(invalidStats)).toThrow();
    });

    it('should reject stats with invalid activity data', () => {
      const invalidStats = {
        totalActions: 100,
        actionsByType: {
          LOGIN: 50,
        },
        activityByDay: [
          { date: '2023-01-01', count: 'invalid' }, // Invalid: count should be a number
        ],
      };

      expect(() => UserStatsSchema.parse(invalidStats)).toThrow();
    });
  });

  describe('AddActivityLogSchema', () => {
    it('should validate valid activity log creation', () => {
      const validLogData = {
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
        metadata: { ip: '192.168.1.1' },
      };

      expect(() => AddActivityLogSchema.parse(validLogData)).not.toThrow();
    });

    it('should validate log creation without metadata', () => {
      const validLogData = {
        userId: 'user-123',
        actionType: 'LOGIN',
        description: 'User logged in',
      };

      expect(() => AddActivityLogSchema.parse(validLogData)).not.toThrow();
    });

    it('should reject log creation with missing required fields', () => {
      const invalidLogData = {
        userId: 'user-123',
        // missing actionType
        description: 'User logged in',
      };

      expect(() => AddActivityLogSchema.parse(invalidLogData)).toThrow();
    });
  });
}); 