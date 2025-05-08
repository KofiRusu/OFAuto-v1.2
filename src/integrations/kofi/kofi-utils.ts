import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

// Ko-fi API configuration
export const KOFI_API_BASE_URL = 'https://ko-fi.com/api/v1';
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

// Store axios instances keyed by API key to avoid recreation
const axiosInstances: Record<string, AxiosInstance> = {};

/**
 * Creates or retrieves an Axios instance configured for Ko-fi API calls,
 * including retry logic and API key authentication.
 */
export const createKofiApiClient = (apiKey: string): AxiosInstance => {
  if (axiosInstances[apiKey]) {
    return axiosInstances[apiKey];
  }

  const instance = axios.create({
    baseURL: KOFI_API_BASE_URL,
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  // Add response interceptor for retry logic
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!error.config) {
        return Promise.reject(error);
      }

      // Create retry count if it doesn't exist
      error.config._retryCount = error.config._retryCount || 0;

      // Check if we should retry
      if (
        error.config._retryCount < MAX_RETRIES &&
        (error.response?.status === 429 || // Rate limiting
         error.response?.status >= 500 ||  // Server errors
         error.code === 'ECONNABORTED' ||  // Timeout
         error.code === 'ETIMEDOUT')      // Timeout
      ) {
        error.config._retryCount += 1;
        logger.warn(`Ko-fi request failed, retrying... (${error.config._retryCount}/${MAX_RETRIES})`, { 
          url: error.config.url, 
          status: error.response?.status, 
          code: error.code 
        });

        // Apply exponential backoff with jitter
        const delay = RETRY_DELAY_MS * Math.pow(2, error.config._retryCount - 1) *
          (0.5 + Math.random() * 0.5); // Add jitter between 50-100%

        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(error.config); // Retry with the same instance
      }

      // Log the final error
      logApiError(error);

      return Promise.reject(error);
    }
  );
  
  axiosInstances[apiKey] = instance;
  return instance;
};

/**
 * Log API errors to a file for debugging
 */
export function logApiError(error: any): void {
  try {
    const timestamp = new Date().toISOString();
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, 'kofi-api-errors.log');
    
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
 * Parse Ko-fi donations into a standardized format
 * @param data Raw donation data from Ko-fi
 * @returns Normalized donation data
 */
export function parseDonations(data: any): any[] {
  try {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((donation: any) => ({
      id: donation.kofi_transaction_id || donation.id || `kofi-${Date.now()}`,
      supporterName: donation.from_name || 'Anonymous',
      supporterEmail: donation.email || '',
      amount: parseFloat(donation.amount) || 0,
      currency: donation.currency || 'USD',
      message: donation.message || '',
      timestamp: donation.timestamp ? new Date(donation.timestamp) : new Date(),
      isSubscription: donation.is_subscription_payment === true,
      tier: donation.tier_name || '',
      isFirstSubscription: donation.is_first_subscription_payment === true,
    }));
  } catch (error) {
    console.error('Error parsing Ko-fi donations:', error);
    return [];
  }
}

/**
 * Parse Ko-fi shop orders into a standardized format
 * @param data Raw shop order data from Ko-fi
 * @returns Normalized shop order data
 */
export function parseShopOrders(data: any): any[] {
  try {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((order: any) => ({
      id: order.order_id || order.id || `kofi-order-${Date.now()}`,
      customerName: order.buyer_name || 'Anonymous',
      customerEmail: order.buyer_email || '',
      totalAmount: parseFloat(order.total_amount) || 0,
      currency: order.currency || 'USD',
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        name: item.direct_link_name || item.name || '',
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || 0,
      })) : [],
      timestamp: order.timestamp ? new Date(order.timestamp) : new Date(),
      shippingAddress: order.shipping_address || null,
    }));
  } catch (error) {
    console.error('Error parsing Ko-fi shop orders:', error);
    return [];
  }
}

/**
 * Format date for Ko-fi API if needed
 */
export function formatDateForKofi(date: Date): string {
  return date.toISOString();
} 