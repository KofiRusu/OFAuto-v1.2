import { KofiIntegration } from '../kofi-integration';
import * as kofiAuth from '../kofi-auth';
import { axiosWithRetry } from '../kofi-utils';

// Mock dependencies
jest.mock('../kofi-auth');
jest.mock('../kofi-utils', () => ({
  axiosWithRetry: {
    get: jest.fn(),
    post: jest.fn(),
  },
  parseDonations: jest.fn().mockReturnValue([]),
  parseShopOrders: jest.fn().mockReturnValue([]),
  formatDateForKofi: jest.fn().mockImplementation((date) => date.toISOString()),
  KOFI_API_BASE_URL: 'https://ko-fi.com/api/v1',
}));

describe('KofiIntegration', () => {
  const mockPlatformId = 'platform-123';
  let kofiIntegration: KofiIntegration;

  beforeEach(() => {
    jest.clearAllMocks();
    kofiIntegration = new KofiIntegration(mockPlatformId);
    
    // Mock hasValidApiKey to return true
    jest.spyOn(kofiAuth, 'hasValidApiKey').mockResolvedValue(true);
    
    // Mock getApiKey to return a test key
    jest.spyOn(kofiAuth, 'getApiKey').mockResolvedValue('test-api-key');
  });

  describe('authenticate', () => {
    it('should store API key and return success', async () => {
      // Mock storeApiKey
      const mockAuthResult = {
        accessToken: 'test-api-key',
        successful: true,
      };
      jest.spyOn(kofiAuth, 'storeApiKey').mockResolvedValue(mockAuthResult);
      
      // Call authenticate
      const result = await kofiIntegration.authenticate('test-api-key');
      
      // Verify storeApiKey was called
      expect(kofiAuth.storeApiKey).toHaveBeenCalledWith('test-api-key', mockPlatformId);
      
      // Verify result
      expect(result).toEqual(mockAuthResult);
    });
    
    it('should handle authentication error', async () => {
      // Mock storeApiKey to fail
      const mockErrorResult = {
        accessToken: '',
        successful: false,
        error: 'Invalid API key',
      };
      jest.spyOn(kofiAuth, 'storeApiKey').mockResolvedValue(mockErrorResult);
      
      // Call authenticate
      const result = await kofiIntegration.authenticate('invalid-api-key');
      
      // Verify result
      expect(result).toEqual(mockErrorResult);
    });
  });

  describe('fetchStats', () => {
    it('should return placeholder stats for now', async () => {
      // Call fetchStats
      const result = await kofiIntegration.fetchStats();
      
      // Verify getApiKey was called
      expect(kofiAuth.getApiKey).toHaveBeenCalledWith(mockPlatformId);
      
      // Verify result contains the expected structure
      expect(result).toEqual({
        followers: 42,
        totalIncome: 1234.56,
        currency: 'USD',
        tierBreakdown: [
          {
            tierId: 'monthly',
            tierName: 'Monthly Membership',
            tierAmount: 500,
            supporterCount: 20,
          },
          {
            tierId: 'yearly',
            tierName: 'Yearly Membership',
            tierAmount: 5000,
            supporterCount: 5,
          },
        ],
        lastUpdated: expect.any(Date),
      });
    });
    
    it('should handle error when no API key is available', async () => {
      // Mock getApiKey to return null
      jest.spyOn(kofiAuth, 'getApiKey').mockResolvedValue(null);
      
      // Call fetchStats
      const result = await kofiIntegration.fetchStats();
      
      // Verify result contains error
      expect(result.error).toBeTruthy();
      expect(result).toEqual(expect.objectContaining({
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: expect.any(Date),
        error: 'No valid API key available',
      }));
    });
  });

  describe('createPost', () => {
    it('should return error as Ko-fi does not support post creation via API', async () => {
      // Create post payload
      const postPayload = {
        title: 'Test Post',
        content: 'This is a test post',
      };
      
      // Call createPost
      const result = await kofiIntegration.createPost(postPayload);
      
      // Verify result
      expect(result).toEqual({
        successful: false,
        error: 'Ko-fi API does not support post creation currently',
      });
    });
  });

  describe('pollNewActivity', () => {
    it('should return empty array for now (scaffold)', async () => {
      // Call pollNewActivity
      const result = await kofiIntegration.pollNewActivity();
      
      // Verify result is an empty array
      expect(result).toEqual([]);
    });
  });
}); 