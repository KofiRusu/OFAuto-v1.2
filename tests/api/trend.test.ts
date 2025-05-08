import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../../src/lib/db/prisma';
import { createCaller } from '../../src/lib/trpc/server';

// Mock auth context for an admin user
const mockAdminContext = {
  userId: 'test-admin-id',
  user: {
    id: 'test-admin-id',
    role: 'ADMIN',
    email: 'admin@example.com',
    name: 'Test Admin'
  },
  prisma,
};

// Mock auth context for a regular user
const mockUserContext = {
  userId: 'test-user-id',
  user: {
    id: 'test-user-id',
    role: 'USER',
    email: 'user@example.com',
    name: 'Test User'
  },
  prisma,
};

// Mock trend service functions
jest.mock('../../src/lib/services/trendService', () => ({
  storeTrendBatch: jest.fn().mockResolvedValue({}),
  fetchAllTrends: jest.fn().mockResolvedValue({
    trends: [
      {
        name: '#TestTrend1',
        source: 'Twitter',
        metrics: [{ platform: 'Twitter', value: 1000 }]
      },
      {
        name: '#TestTrend2',
        source: 'TikTok',
        metrics: [{ platform: 'TikTok', value: 5000 }]
      }
    ]
  }),
  calculateBoostScore: jest.fn().mockImplementation((id) => {
    // Return different boost scores based on the trend ID to simulate different trend performances
    if (id.includes('high')) return Promise.resolve(1.8);
    if (id.includes('medium')) return Promise.resolve(1.2);
    return Promise.resolve(0.7);
  }),
  generateContentSuggestions: jest.fn().mockImplementation((id) => {
    return Promise.resolve([
      `Test suggestion 1 for ${id}`,
      `Test suggestion 2 for ${id}`,
      `Test suggestion 3 for ${id}`,
    ]);
  }),
}));

describe('Trend API', () => {
  // Test data IDs
  let highTrendId: string;
  let mediumTrendId: string;
  let lowTrendId: string;
  
  beforeAll(async () => {
    // Create test users
    await prisma.user.upsert({
      where: { id: 'test-admin-id' },
      update: {},
      create: {
        id: 'test-admin-id',
        email: 'admin@example.com',
        name: 'Test Admin',
        clerkId: 'test-admin-clerk-id',
        role: 'ADMIN',
      },
    });
    
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'user@example.com',
        name: 'Test User',
        clerkId: 'test-user-clerk-id',
        role: 'USER',
      },
    });
    
    // Create test trends with different performance profiles
    const highTrend = await prisma.trend.create({
      data: {
        name: 'High Performing Trend',
        source: 'Twitter',
        metrics: {
          create: {
            platform: 'Twitter',
            value: 15000,
          }
        }
      },
      include: {
        metrics: true
      }
    });
    
    const mediumTrend = await prisma.trend.create({
      data: {
        name: 'Medium Performing Trend',
        source: 'TikTok',
        metrics: {
          create: {
            platform: 'TikTok',
            value: 7500,
          }
        }
      },
      include: {
        metrics: true
      }
    });
    
    const lowTrend = await prisma.trend.create({
      data: {
        name: 'Low Performing Trend',
        source: 'Instagram',
        metrics: {
          create: {
            platform: 'Instagram',
            value: 2500,
          }
        }
      },
      include: {
        metrics: true
      }
    });
    
    // Store IDs for later use
    highTrendId = highTrend.id;
    mediumTrendId = mediumTrend.id;
    lowTrendId = lowTrend.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.trendMetric.deleteMany({});
    await prisma.trend.deleteMany({});
    
    await prisma.user.delete({
      where: { id: 'test-admin-id' },
    });
    
    await prisma.user.delete({
      where: { id: 'test-user-id' },
    });
  });
  
  test('admin should be able to detect trends', async () => {
    // Create admin caller
    const adminCaller = createCaller(mockAdminContext);
    
    // Call the detect trends endpoint
    const result = await adminCaller.trend.detectTrends({
      trends: [
        {
          name: '#TestTrend',
          source: 'Twitter',
          metrics: [
            {
              platform: 'Twitter',
              value: 1000,
            }
          ]
        }
      ]
    });
    
    // Assertions
    expect(result).toEqual({ success: true });
  });
  
  test('non-admin should not be able to detect trends', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call should be rejected for non-admins
    await expect(userCaller.trend.detectTrends({
      trends: [
        {
          name: '#TestTrend',
          source: 'Twitter',
          metrics: [
            {
              platform: 'Twitter',
              value: 1000,
            }
          ]
        }
      ]
    })).rejects.toThrow();
  });
  
  test('manager should be able to refresh trends', async () => {
    // Create context with manager role
    const managerContext = {
      ...mockUserContext,
      user: {
        ...mockUserContext.user,
        role: 'MANAGER'
      }
    };
    
    const managerCaller = createCaller(managerContext);
    
    // Call the refresh trends endpoint
    const result = await managerCaller.trend.refreshTrends();
    
    // Assertions
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('trendsDetected', 2); // From our mock data
  });
  
  test('user should be able to get recent trends', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call get recent trends endpoint
    const result = await userCaller.trend.getRecentTrends({
      limit: 10
    });
    
    // Assertions
    expect(result).toHaveProperty('trends');
    expect(result).toHaveProperty('timestamp');
    expect(result.trends.length).toBeGreaterThan(0);
    
    // Each trend should have a boost score
    expect(result.trends[0]).toHaveProperty('boostScore');
  });
  
  test('user should be able to filter trends by source', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call get recent trends with source filter
    const result = await userCaller.trend.getRecentTrends({
      limit: 10,
      source: 'Twitter',
    });
    
    // Assertions
    expect(result).toHaveProperty('trends');
    
    // All returned trends should be from Twitter
    result.trends.forEach(trend => {
      expect(trend.source).toBe('Twitter');
    });
  });
  
  test('user should be able to get trend metrics', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call get trend metrics endpoint
    const result = await userCaller.trend.getTrendMetrics({
      trendId: highTrendId,
      timeframe: 'day'
    });
    
    // Assertions
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('timeframe', 'day');
    expect(result.trend.id).toBe(highTrendId);
  });
  
  test('getting metrics for non-existent trend should fail', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call with non-existent ID should fail
    await expect(userCaller.trend.getTrendMetrics({
      trendId: 'non-existent-id',
      timeframe: 'day'
    })).rejects.toThrow();
  });
  
  test('user should be able to get content suggestions for a trend', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call get content suggestions endpoint
    const result = await userCaller.trend.getContentSuggestions({
      trendId: highTrendId,
    });
    
    // Assertions
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('suggestions');
    expect(result.trend.id).toBe(highTrendId);
    expect(result.suggestions.length).toBe(3); // From our mock data
  });
  
  test('admin should be able to get trend settings', async () => {
    // Create admin caller
    const adminCaller = createCaller(mockAdminContext);
    
    // Call get trend settings endpoint
    const result = await adminCaller.trend.getTrendSettings();
    
    // Assertions
    expect(result).toHaveProperty('refreshInterval');
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('autoSuggestPosts');
    expect(result).toHaveProperty('minEngagementThreshold');
  });
  
  test('regular user should not be able to access trend settings', async () => {
    // Create regular user caller
    const userCaller = createCaller(mockUserContext);
    
    // Call should be rejected for non-admins
    await expect(userCaller.trend.getTrendSettings()).rejects.toThrow();
  });
  
  test('admin should be able to update trend settings', async () => {
    // Create admin caller
    const adminCaller = createCaller(mockAdminContext);
    
    // Call update trend settings endpoint
    const result = await adminCaller.trend.updateTrendSettings({
      refreshInterval: 30,
      sources: [
        {
          name: 'Twitter',
          enabled: true,
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        }
      ],
      autoSuggestPosts: true,
      minEngagementThreshold: 0.8,
    });
    
    // Assertions
    expect(result).toHaveProperty('success', true);
  });
}); 