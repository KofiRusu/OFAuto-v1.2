import { PatreonIntegration } from '../patreon-integration';
import * as patreonAuth from '../patreon-auth';
import { axiosWithRetry } from '../patreon-utils';

// Mock dependencies
jest.mock('../patreon-auth');
jest.mock('../patreon-utils', () => ({
  axiosWithRetry: {
    get: jest.fn(),
    post: jest.fn(),
  },
  extractCampaignId: jest.fn().mockImplementation((data) => data?.data?.[0]?.id || null),
  parsePatrons: jest.fn().mockReturnValue([]),
  formatDateForPatreon: jest.fn().mockImplementation((date) => date.toISOString()),
  PATREON_API_BASE_URL: 'https://www.patreon.com/api/oauth2/v2',
}));

describe('PatreonIntegration', () => {
  const mockPlatformId = 'platform-123';
  let patreonIntegration: PatreonIntegration;

  beforeEach(() => {
    jest.clearAllMocks();
    patreonIntegration = new PatreonIntegration(mockPlatformId);
    
    // Mock getValidAccessToken to return a test token
    jest.spyOn(patreonAuth, 'getValidAccessToken').mockResolvedValue('test-token');
    
    // Mock axiosWithRetry for campaign data
    (axiosWithRetry.get as jest.Mock).mockImplementation((endpoint) => {
      if (endpoint === '/campaigns') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'campaign-123',
                attributes: { title: 'Test Campaign' },
              },
            ],
          },
        });
      } else if (endpoint === '/campaigns/campaign-123') {
        return Promise.resolve({
          data: {
            data: {
              id: 'campaign-123',
              attributes: {
                patron_count: 42,
                pledge_sum: 1234,
              },
            },
          },
        });
      } else if (endpoint === '/campaigns/campaign-123/tiers') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'tier-1',
                attributes: {
                  title: 'Bronze Tier',
                  amount_cents: 500,
                  patron_count: 20,
                  published: true,
                },
              },
              {
                id: 'tier-2',
                attributes: {
                  title: 'Silver Tier',
                  amount_cents: 1000,
                  patron_count: 15,
                  published: true,
                },
              },
            ],
          },
        });
      } else if (endpoint === '/campaigns/campaign-123/members') {
        return Promise.resolve({
          data: { data: [] }, // Empty data for simplicity
        });
      }
      
      return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
    });
    
    // Mock axiosWithRetry.post for creating posts
    (axiosWithRetry.post as jest.Mock).mockImplementation((endpoint) => {
      if (endpoint === '/posts') {
        return Promise.resolve({
          data: {
            data: {
              id: 'post-123',
              attributes: {
                url: 'https://www.patreon.com/posts/test-post-123',
              },
            },
          },
        });
      }
      
      return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
    });
  });

  describe('authenticate', () => {
    it('should exchange code for token and initialize', async () => {
      // Mock exchangeCodeForToken
      const mockAuthResult = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
        successful: true,
      };
      jest.spyOn(patreonAuth, 'exchangeCodeForToken').mockResolvedValue(mockAuthResult);
      
      // Call authenticate
      const result = await patreonIntegration.authenticate('test-code');
      
      // Verify exchangeCodeForToken was called
      expect(patreonAuth.exchangeCodeForToken).toHaveBeenCalledWith('test-code', mockPlatformId);
      
      // Verify result
      expect(result).toEqual(mockAuthResult);
    });
    
    it('should handle authentication error', async () => {
      // Mock exchangeCodeForToken to fail
      const mockErrorResult = {
        accessToken: '',
        successful: false,
        error: 'Invalid code',
      };
      jest.spyOn(patreonAuth, 'exchangeCodeForToken').mockResolvedValue(mockErrorResult);
      
      // Call authenticate
      const result = await patreonIntegration.authenticate('invalid-code');
      
      // Verify result
      expect(result).toEqual(mockErrorResult);
    });
  });

  describe('fetchStats', () => {
    it('should fetch campaign stats and return normalized data', async () => {
      // Call fetchStats
      const result = await patreonIntegration.fetchStats();
      
      // Verify getValidAccessToken was called
      expect(patreonAuth.getValidAccessToken).toHaveBeenCalledWith(mockPlatformId);
      
      // Verify HTTP requests
      expect(axiosWithRetry.get).toHaveBeenCalledWith('/campaigns', expect.any(Object));
      expect(axiosWithRetry.get).toHaveBeenCalledWith('/campaigns/campaign-123', expect.any(Object));
      expect(axiosWithRetry.get).toHaveBeenCalledWith('/campaigns/campaign-123/tiers', expect.any(Object));
      
      // Verify result
      expect(result).toEqual({
        followers: 42,
        totalIncome: 1234,
        currency: 'USD',
        tierBreakdown: [
          {
            tierId: 'tier-1',
            tierName: 'Bronze Tier',
            tierAmount: 500,
            supporterCount: 20,
          },
          {
            tierId: 'tier-2',
            tierName: 'Silver Tier',
            tierAmount: 1000,
            supporterCount: 15,
          },
        ],
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('createPost', () => {
    it('should create a post with the correct data', async () => {
      // Create post payload
      const postPayload = {
        title: 'Test Post',
        content: 'This is a test post',
        isPublic: true,
      };
      
      // Call createPost
      const result = await patreonIntegration.createPost(postPayload);
      
      // Verify HTTP request
      expect(axiosWithRetry.post).toHaveBeenCalledWith('/posts', {
        data: {
          type: 'post',
          attributes: {
            title: 'Test Post',
            content: 'This is a test post',
            is_public: true,
          },
          relationships: {
            campaign: {
              data: {
                type: 'campaign',
                id: 'campaign-123',
              },
            },
          },
        },
      }, expect.any(Object));
      
      // Verify result
      expect(result).toEqual({
        postId: 'post-123',
        url: 'https://www.patreon.com/posts/test-post-123',
        successful: true,
        scheduledFor: undefined,
      });
    });
    
    it('should handle posting error', async () => {
      // Mock axiosWithRetry.post to fail
      (axiosWithRetry.post as jest.Mock).mockRejectedValueOnce(new Error('Failed to create post'));
      
      // Create post payload
      const postPayload = {
        title: 'Test Post',
        content: 'This is a test post',
      };
      
      // Call createPost
      const result = await patreonIntegration.createPost(postPayload);
      
      // Verify result
      expect(result).toEqual({
        successful: false,
        error: 'Failed to create post',
      });
    });
  });
}); 