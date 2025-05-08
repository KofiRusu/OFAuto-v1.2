import { OnlyFansIntegration } from '../onlyfans-integration';
import * as ofBrowser from '../onlyfans-browser';
import * as ofAuth from '../onlyfans-auth';
import * as ofUtils from '../onlyfans-utils';
import { BasePlatformIntegration, PostPayload, DMResult, ActivityResult, AnalyticsResult, PostResult, AuthResult } from '../../BasePlatformIntegration';
import { ExecutionResult } from '@/lib/execution-agent/types'; // Assuming this type exists

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
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
    getNextProxy: jest.fn().mockReturnValue(null), // Default to no proxy for tests
  },
}));

jest.mock('../onlyfans-browser');
jest.mock('../onlyfans-auth');
jest.mock('../onlyfans-utils');

// Mock Puppeteer page methods
const mockPage = {
  goto: jest.fn(),
  $eval: jest.fn(),
  $$: jest.fn().mockResolvedValue([]),
  evaluate: jest.fn(),
  waitForSelector: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  keyboard: {
    type: jest.fn(),
  },
  screenshot: jest.fn(),
  setUserAgent: jest.fn(),
  setCookie: jest.fn(),
  close: jest.fn(),
  isClosed: jest.fn().mockReturnValue(false),
  setDefaultNavigationTimeout: jest.fn(),
  waitForNavigation: jest.fn(),
  $: jest.fn().mockResolvedValue(true), // Assume element exists by default
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  on: jest.fn(),
};

describe('OnlyFansIntegration', () => {
  let onlyfansIntegration: OnlyFansIntegration;
  const platformId = 'test-of-platform';

  beforeEach(() => {
    jest.clearAllMocks();
    onlyfansIntegration = new OnlyFansIntegration(platformId);

    // Reset mocks for browser/page
    Object.values(mockPage).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
     Object.values(mockBrowser).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    // Setup default mock implementations
    (ofBrowser.launchOnlyFansSession as jest.Mock).mockResolvedValue({ page: mockPage, browser: mockBrowser });
    (ofAuth.authenticateWithCookies as jest.Mock).mockResolvedValue({ successful: true, accessToken: 'n/a' });
    (ofUtils.randomDelay as jest.Mock).mockResolvedValue(undefined);
    (ofUtils.humanType as jest.Mock).mockResolvedValue(undefined);
    (ofUtils.safeClick as jest.Mock).mockResolvedValue(undefined);
    (ofUtils.elementExists as jest.Mock).mockResolvedValue(true);
    mockPage.waitForSelector.mockResolvedValue(undefined);
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.close.mockResolvedValue(undefined);
    mockPage.$eval.mockResolvedValue('0'); // Default for stats
    mockPage.$.mockResolvedValue(true);
  });

  describe('authenticate', () => {
    it('should call authenticateWithCookies', async () => {
      const expectedResult: AuthResult = { successful: true, accessToken: 'n/a' };
      const result = await onlyfansIntegration.authenticate();
      expect(ofAuth.authenticateWithCookies).toHaveBeenCalledWith(platformId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('withBrowserPage', () => {
    it('should launch session, execute action, and close page', async () => {
      const action = jest.fn().mockResolvedValue('Success');
      const result = await (onlyfansIntegration as any).withBrowserPage(action);

      expect(ofBrowser.launchOnlyFansSession).toHaveBeenCalledWith(platformId);
      expect(action).toHaveBeenCalledWith(mockPage);
      expect(mockPage.close).toHaveBeenCalled();
      expect(result).toBe('Success');
    });

    it('should handle errors during action and take screenshot', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const onError = jest.fn();
      const result = await (onlyfansIntegration as any).withBrowserPage(action, onError);

      expect(ofBrowser.launchOnlyFansSession).toHaveBeenCalledWith(platformId);
      expect(action).toHaveBeenCalledWith(mockPage);
      expect(ofUtils.takeErrorScreenshot).toHaveBeenCalledWith(mockPage, expect.stringContaining('action-error'));
      expect(mockPage.close).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error), mockPage);
      expect(result).toBeNull();
    });

     it('should handle session launch failure', async () => {
      (ofBrowser.launchOnlyFansSession as jest.Mock).mockResolvedValue(null);
      const action = jest.fn();
      const result = await (onlyfansIntegration as any).withBrowserPage(action);

      expect(action).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('fetchStats', () => {
    it('should fetch stats from the stats page', async () => {
      mockPage.$eval.mockImplementation((selector) => {
        if (selector === ofUtils.SELECTORS.subscriberCount) return '1,234 Subscribers';
        // if (selector === ofUtils.SELECTORS.totalEarnings) return '$567.89'; // Uncomment if selector is known
        return '0';
      });

      const result = await onlyfansIntegration.fetchStats();

      expect(mockPage.goto).toHaveBeenCalledWith(expect.stringContaining('/my/statements/stats'), expect.anything());
      expect(mockPage.$eval).toHaveBeenCalledWith(ofUtils.SELECTORS.subscriberCount, expect.any(Function));
      // expect(mockPage.$eval).toHaveBeenCalledWith(ofUtils.SELECTORS.totalEarnings, expect.any(Function));
      expect(result).toMatchObject({
        followers: 1234,
        // totalIncome: 567.89, // Uncomment if testing income
        totalIncome: 0, // Using placeholder for now
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('createPost', () => {
    it('should navigate to home, type content, and click post', async () => {
      const payload: PostPayload = { title: 'Test', content: 'Test content' };
      await onlyfansIntegration.createPost(payload);

      expect(mockPage.goto).toHaveBeenCalledWith('https://onlyfans.com', expect.anything());
      expect(ofUtils.humanType).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.newPostTextArea, payload.content);
      expect(ofUtils.safeClick).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.postSubmitButton);
      expect(mockPage.waitForNavigation).toHaveBeenCalled();
    });
    
     it('should return error result on failure', async () => {
      (ofBrowser.launchOnlyFansSession as jest.Mock).mockRejectedValue(new Error('Launch failed'));
      const payload: PostPayload = { title: 'Test', content: 'Test content' };
      const result = await onlyfansIntegration.createPost(payload);
      expect(result).toEqual({
        successful: false,
        error: 'Failed to create OnlyFans post',
      });
    });
  });

  describe('sendDM', () => {
    it('should navigate to chat, type message, and click send', async () => {
      const recipientId = 'user123';
      const message = 'Hello there!';
      await onlyfansIntegration.sendDM(recipientId, message);

      expect(mockPage.goto).toHaveBeenCalledWith(expect.stringContaining(`/my/chats/user/${recipientId}`), expect.anything());
      expect(ofUtils.humanType).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.messageInput, message);
      expect(ofUtils.safeClick).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.sendMessageButton);
    });
    
    it('should return error result on failure', async () => {
      (ofBrowser.launchOnlyFansSession as jest.Mock).mockRejectedValue(new Error('Launch failed'));
      const result = await onlyfansIntegration.sendDM('user123', 'message');
       expect(result).toEqual({
        successful: false,
        error: 'Failed to send OnlyFans DM',
      });
    });
  });
  
  // describe('adjustPricing', () => {
  //   // Tests for adjustPricing require ExecutionResult type definition
  //   it('should navigate to settings, update price, and save', async () => {
  //     const newPrice = 19.99;
  //     await onlyfansIntegration.adjustPricing(newPrice);

  //     expect(mockPage.goto).toHaveBeenCalledWith(expect.stringContaining('/my/settings/subscription'), expect.anything());
  //     expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), ofUtils.SELECTORS.subscriptionPriceInput);
  //     expect(ofUtils.humanType).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.subscriptionPriceInput, newPrice.toString());
  //     expect(ofUtils.safeClick).toHaveBeenCalledWith(mockPage, ofUtils.SELECTORS.savePricingButton);
  //     expect(mockPage.waitForNavigation).toHaveBeenCalled();
  //   });
  // });

  describe('pollNewActivity', () => {
    it('should navigate to notifications page and return empty array (as scraping is placeholder)', async () => {
      const result = await onlyfansIntegration.pollNewActivity();

      expect(mockPage.goto).toHaveBeenCalledWith(expect.stringContaining('/my/notifications'), expect.anything());
      expect(result).toEqual([]);
    });
    
     it('should return empty array on failure', async () => {
      (ofBrowser.launchOnlyFansSession as jest.Mock).mockRejectedValue(new Error('Launch failed'));
      const result = await onlyfansIntegration.pollNewActivity();
       expect(result).toEqual([]);
    });
  });
}); 