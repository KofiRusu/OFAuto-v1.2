import { FanslyIntegration } from '../fansly-integration';
import * as fanslyAuth from '../fansly-auth';
import * as fanslyUtils from '../fansly-utils';
import * as fanslyWebhook from '../fansly-webhook';
import { proxyService } from '@/lib/proxy/proxy-service';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/execution-agent/credential-service', () => ({
  CredentialService: {
    storeCredential: jest.fn(),
    getCredential: jest.fn(),
  },
}));

jest.mock('@/lib/proxy/proxy-service', () => ({
  proxyService: {
    createProxiedAxios: jest.fn(),
    getNextProxy: jest.fn(),
  },
}));

jest.mock('../fansly-auth', () => ({
  authenticate: jest.fn(),
  getValidSession: jest.fn(),
  storeSessionToken: jest.fn(),
  hasValidSession: jest.fn(),
  getSessionToken: jest.fn(),
}));

jest.mock('../fansly-utils', () => ({
  createFanslyApiClient: jest.fn(),
  parseAccountStats: jest.fn(),
  parseSubscribers: jest.fn(),
  prepareRequestBody: jest.fn((data) => data),
  formatDateForFansly: jest.fn((date) => date.toISOString()),
  isAuthError: jest.fn(),
  generateRequestSignature: jest.fn(),
}));

jest.mock('../fansly-webhook', () => ({
  pollFanslyActivity: jest.fn(),
  processNotification: jest.fn(),
}));

describe('FanslyIntegration', () => {
  let fanslyIntegration: FanslyIntegration;
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    fanslyIntegration = new FanslyIntegration('test-platform-id');
    
    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };
    
    (fanslyUtils.createFanslyApiClient as jest.Mock).mockReturnValue(mockAxiosInstance);
    (fanslyAuth.getValidSession as jest.Mock).mockResolvedValue('mock-session-token');
  });
  
  describe('authenticate', () => {
    it('should authenticate with valid credentials', async () => {
      const mockCredentials = { username: 'testuser', password: 'testpass' };
      const mockTokens = { sessionToken: 'mock-session-token' };
      
      (fanslyAuth.authenticate as jest.Mock).mockResolvedValue(mockTokens);
      
      const result = await fanslyIntegration.authenticate(JSON.stringify(mockCredentials));
      
      expect(fanslyAuth.authenticate).toHaveBeenCalledWith(
        'test-platform-id',
        'testuser',
        'testpass'
      );
      expect(result).toEqual({
        accessToken: 'mock-session-token',
        successful: true,
      });
    });
    
    it('should handle authentication errors', async () => {
      const mockCredentials = { username: 'testuser', password: 'testpass' };
      
      (fanslyAuth.authenticate as jest.Mock).mockRejectedValue(new Error('Auth failed'));
      
      const result = await fanslyIntegration.authenticate(JSON.stringify(mockCredentials));
      
      expect(result).toEqual({
        successful: false,
        error: 'Auth failed',
        accessToken: '',
      });
    });
    
    it('should handle invalid JSON', async () => {
      const result = await fanslyIntegration.authenticate('not-json');
      
      expect(result).toEqual({
        successful: false,
        error: 'Invalid credentials format',
        accessToken: '',
      });
    });
  });
  
  describe('fetchStats', () => {
    it('should fetch and return stats', async () => {
      const mockAccountData = { id: '123', username: 'creator' };
      const mockStatsData = { totalEarnings: 1000 };
      const mockSubscribersData = { subscribers: [] };
      const mockParsedStats = {
        followers: 100,
        totalIncome: 1000,
        currency: 'USD',
        tierBreakdown: [],
      };
      
      mockAxiosInstance.get.mockImplementation((endpoint) => {
        if (endpoint === '/account') {
          return Promise.resolve({ data: mockAccountData });
        }
        if (endpoint === '/creator/stats') {
          return Promise.resolve({ data: mockStatsData });
        }
        if (endpoint === '/subscribers') {
          return Promise.resolve({ data: mockSubscribersData });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
      
      (fanslyUtils.parseAccountStats as jest.Mock).mockReturnValue(mockParsedStats);
      
      const result = await fanslyIntegration.fetchStats();
      
      expect(fanslyAuth.getValidSession).toHaveBeenCalledWith('test-platform-id');
      expect(fanslyUtils.createFanslyApiClient).toHaveBeenCalledWith('mock-session-token');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(fanslyUtils.parseAccountStats).toHaveBeenCalledWith({
        ...mockAccountData,
        ...mockStatsData,
        subscribers: mockSubscribersData.subscribers,
      });
      expect(result).toMatchObject({
        ...mockParsedStats,
        lastUpdated: expect.any(Date),
      });
    });
    
    it('should handle missing session token', async () => {
      (fanslyAuth.getValidSession as jest.Mock).mockResolvedValue(null);
      
      const result = await fanslyIntegration.fetchStats();
      
      expect(result).toEqual({
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: expect.any(Date),
        error: 'No valid session token',
      });
    });
  });
  
  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const mockPayload = {
        title: 'Test Post',
        content: 'Hello world',
        isPublic: true,
      };
      
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          postId: 'post-123',
          url: 'https://fansly.com/post/post-123',
        },
      });
      
      const result = await fanslyIntegration.createPost(mockPayload);
      
      expect(fanslyAuth.getValidSession).toHaveBeenCalledWith('test-platform-id');
      expect(fanslyUtils.createFanslyApiClient).toHaveBeenCalledWith('mock-session-token');
      expect(fanslyUtils.prepareRequestBody).toHaveBeenCalledWith({
        endpoint: '/post',
        content: 'Hello world',
        title: 'Test Post',
        accessType: 'public',
        tierIds: [],
        mediaIds: [],
        scheduled: undefined,
      });
      expect(result).toEqual({
        postId: 'post-123',
        url: 'https://fansly.com/post/post-123',
        successful: true,
      });
    });
    
    it('should handle scheduled posts', async () => {
      const scheduledDate = new Date('2023-12-31T12:00:00Z');
      const mockPayload = {
        title: 'Scheduled Post',
        content: 'Future content',
        isPublic: false,
        tiers: ['tier-1', 'tier-2'],
        scheduledFor: scheduledDate,
      };
      
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          postId: 'post-456',
          url: 'https://fansly.com/post/post-456',
        },
      });
      
      const result = await fanslyIntegration.createPost(mockPayload);
      
      expect(fanslyUtils.formatDateForFansly).toHaveBeenCalledWith(scheduledDate);
      expect(fanslyUtils.prepareRequestBody).toHaveBeenCalledWith({
        endpoint: '/post',
        content: 'Future content',
        title: 'Scheduled Post',
        accessType: 'followers',
        tierIds: ['tier-1', 'tier-2'],
        mediaIds: [],
        scheduled: scheduledDate.toISOString(),
      });
      expect(result).toEqual({
        postId: 'post-456',
        url: 'https://fansly.com/post/post-456',
        successful: true,
        scheduledFor: scheduledDate,
      });
    });
  });
  
  describe('sendDM', () => {
    it('should send a DM successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          messageId: 'msg-123',
        },
      });
      
      const result = await fanslyIntegration.sendDM('user-123', 'Hello');
      
      expect(fanslyAuth.getValidSession).toHaveBeenCalledWith('test-platform-id');
      expect(fanslyUtils.createFanslyApiClient).toHaveBeenCalledWith('mock-session-token');
      expect(fanslyUtils.prepareRequestBody).toHaveBeenCalledWith({
        endpoint: '/messages',
        recipientId: 'user-123',
        content: 'Hello',
      });
      expect(result).toEqual({
        messageId: 'msg-123',
        successful: true,
      });
    });
    
    it('should handle DM errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Failed to send'));
      
      const result = await fanslyIntegration.sendDM('user-123', 'Hello');
      
      expect(result).toEqual({
        successful: false,
        error: 'Failed to send',
      });
    });
  });
  
  describe('pollNewActivity', () => {
    it('should poll for new activity', async () => {
      const mockActivities = [
        {
          type: 'new_pledge',
          userId: 'user-123',
          username: 'subscriber1',
          amount: 10,
          timestamp: new Date(),
        },
      ];
      
      (fanslyWebhook.pollFanslyActivity as jest.Mock).mockResolvedValue(mockActivities);
      
      const result = await fanslyIntegration.pollNewActivity();
      
      expect(fanslyWebhook.pollFanslyActivity).toHaveBeenCalledWith('test-platform-id');
      expect(result).toEqual(mockActivities);
    });
    
    it('should handle polling errors', async () => {
      (fanslyWebhook.pollFanslyActivity as jest.Mock).mockRejectedValue(
        new Error('Polling failed')
      );
      
      const result = await fanslyIntegration.pollNewActivity();
      
      expect(result).toEqual([]);
    });
  });
}); 