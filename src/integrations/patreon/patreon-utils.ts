import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

// Patreon API configuration
export const PATREON_API_BASE_URL = 'https://www.patreon.com/api/oauth2/v2';
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

// Create axios instance with retry logic
export const axiosWithRetry: AxiosInstance = axios.create({
  baseURL: PATREON_API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for retry logic
axiosWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    // Create retry count if it doesn't exist
    error.config.retryCount = error.config.retryCount || 0;

    // Check if we should retry
    if (
      error.config.retryCount < MAX_RETRIES &&
      (error.response?.status === 429 || // Rate limiting
       error.response?.status >= 500 ||  // Server errors
       error.code === 'ECONNABORTED' ||  // Timeout
       error.code === 'ETIMEDOUT')      // Timeout
    ) {
      error.config.retryCount += 1;

      // Apply exponential backoff with jitter
      const delay = RETRY_DELAY_MS * Math.pow(2, error.config.retryCount - 1) *
        (0.5 + Math.random() * 0.5); // Add jitter between 50-100%

      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosWithRetry(error.config);
    }

    // Log the error to file
    logApiError(error);

    return Promise.reject(error);
  }
);

/**
 * Log API errors to a file for debugging
 */
function logApiError(error: any): void {
  try {
    const timestamp = new Date().toISOString();
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, 'patreon-api-errors.log');
    
    const errorData = {
      timestamp,
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };
    
    fs.appendFileSync(
      logFile,
      `${JSON.stringify(errorData, null, 2)}\n-------\n`
    );
  } catch (logError) {
    console.error('Error logging API error:', logError);
  }
}

/**
 * Helper to parse the campaign ID from Patreon data
 */
export function extractCampaignId(data: any): string | null {
  try {
    if (data?.data?.[0]?.id) {
      return data.data[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error extracting campaign ID:', error);
    return null;
  }
}

/**
 * Helper to parse member/patron information into a standardized format
 */
export function parsePatrons(data: any): any[] {
  try {
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }
    
    return data.data.map((patron: any) => {
      const attributes = patron.attributes || {};
      const relationships = patron.relationships || {};
      
      // Get tier data if included
      let tierData = null;
      if (relationships.currently_entitled_tiers && 
          relationships.currently_entitled_tiers.data && 
          relationships.currently_entitled_tiers.data.length > 0) {
        const tierId = relationships.currently_entitled_tiers.data[0].id;
        tierData = data.included?.find((inc: any) => 
          inc.type === 'tier' && inc.id === tierId
        );
      }
      
      return {
        id: patron.id,
        email: attributes.email,
        fullName: attributes.full_name,
        isFollower: attributes.is_follower === true,
        patronStatus: attributes.patron_status,
        pledgeAmount: attributes.pledge_amount_cents,
        pledgeAmountCurrency: attributes.pledge_currency || 'USD',
        joinedAt: attributes.pledge_relationship_start || null,
        tierId: tierData?.id || null,
        tierTitle: tierData?.attributes?.title || null,
        tierAmount: tierData?.attributes?.amount_cents || null,
      };
    });
  } catch (error) {
    console.error('Error parsing patrons:', error);
    return [];
  }
}

/**
 * Format date for Patreon API
 */
export function formatDateForPatreon(date: Date): string {
  return date.toISOString();
} 