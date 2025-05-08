import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { 
  exchangeOAuthCode, 
  refreshAccessToken, 
  getConnectionStatus, 
  getAuthorizationUrl 
} from '../quickBooksService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variables
vi.mock('@/env.mjs', () => ({
  env: {
    QUICKBOOKS_CLIENT_ID: 'test-client-id',
    QUICKBOOKS_CLIENT_SECRET: 'test-client-secret',
    QUICKBOOKS_REDIRECT_URI: 'http://localhost:3000/dashboard/integrations/quickbooks',
  },
}));

describe('QuickBooks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exchangeOAuthCode', () => {
    it('should exchange OAuth code for tokens', async () => {
      // Mock response
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

      // Call the function
      const result = await exchangeOAuthCode('test-code');

      // Check result
      expect(result).toEqual(mockTokenResponse.data);

      // Check that axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic '),
          }),
        })
      );
    });

    it('should throw an error when exchange fails', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      // Call the function and expect it to throw
      await expect(exchangeOAuthCode('test-code')).rejects.toThrow('Failed to exchange OAuth code for tokens');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      // Mock response
      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

      // Call the function
      const result = await refreshAccessToken('test-refresh-token');

      // Check result
      expect(result).toEqual(mockTokenResponse.data);

      // Check that axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic '),
          }),
        })
      );
    });

    it('should throw an error when refresh fails', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      // Call the function and expect it to throw
      await expect(refreshAccessToken('test-refresh-token')).rejects.toThrow('Failed to refresh access token');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return CONNECTED when API call succeeds', async () => {
      // Mock successful response
      const mockResponse = {
        data: { CompanyInfo: { CompanyName: 'Test Company' } },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await getConnectionStatus('test-access-token', 'test-realm-id');

      // Check result
      expect(result).toEqual('CONNECTED');

      // Check that axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://quickbooks.api.intuit.com/v3/company/test-realm-id/companyinfo/test-realm-id',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should return FAILED when API call returns 401', async () => {
      // Mock 401 error
      const mockError = {
        response: { status: 401 },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      // Call the function
      const result = await getConnectionStatus('test-access-token', 'test-realm-id');

      // Check result
      expect(result).toEqual('FAILED');
    });

    it('should return FAILED for other errors', async () => {
      // Mock network error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      // Call the function
      const result = await getConnectionStatus('test-access-token', 'test-realm-id');

      // Check result
      expect(result).toEqual('FAILED');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return the correct OAuth URL', () => {
      // Mock Math.random for testing
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

      // Call the function
      const url = getAuthorizationUrl();

      // Check URL
      expect(url).toContain('https://appcenter.intuit.com/connect/oauth2');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=com.intuit.quickbooks.accounting');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fintegrations%2Fquickbooks');
      expect(url).toContain('state=');

      // Restore Math.random
      randomSpy.mockRestore();
    });
  });
}); 