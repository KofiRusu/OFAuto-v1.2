import { prisma } from '@/lib/prisma';
import { decryptCredential } from '@/lib/security';
import { logger } from '@/lib/logger';

interface GumroadCredentials {
  apiKey: string;
}

export interface GumroadProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  createdAt: Date;
  published: boolean;
  sales_count: number;
  custom_permalink?: string;
}

export interface GumroadSale {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  currency: string;
  purchaser_email: string;
  purchase_date: Date;
  subscription_id?: string;
  refunded: boolean;
}

export class GumroadClient {
  private apiKey: string | null = null;
  private clientId: string;
  private baseUrl = 'https://api.gumroad.com/v2';

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Initialize the client by fetching and decrypting credentials
   */
  async initialize() {
    logger.debug({ clientId: this.clientId }, 'Initializing Gumroad client');
    
    const credential = await prisma.clientCredential.findUnique({
      where: { 
        clientId_platformType: { 
          clientId: this.clientId, 
          platformType: 'gumroad' 
        } 
      },
    });

    if (!credential) {
      logger.error({ clientId: this.clientId }, 'Gumroad credentials not found');
      throw new Error('Gumroad credentials not found');
    }

    const decrypted = decryptCredential({
      encrypted: credential.credential,
      iv: credential.iv,
      authTag: credential.authTag,
    });

    if (!decrypted) {
      logger.error({ clientId: this.clientId }, 'Failed to decrypt Gumroad credentials');
      throw new Error('Failed to decrypt Gumroad credentials');
    }

    const credentials = JSON.parse(decrypted) as GumroadCredentials;
    this.apiKey = credentials.apiKey;
    
    logger.debug({ clientId: this.clientId }, 'Gumroad client initialized successfully');
  }

  /**
   * Helper method to make authenticated API requests to Gumroad
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: Record<string, any>
  ): Promise<T> {
    if (!this.apiKey) {
      await this.initialize();
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // For GET requests, add the access token and params to the URL
    if (method === 'GET' && data) {
      Object.entries(data).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    // Prepare fetch options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    };

    // For non-GET requests, add the data to the body
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      logger.debug({ endpoint, method }, 'Making Gumroad API request');
      
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          endpoint, 
          method, 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        }, 'Gumroad API request failed');
        
        throw new Error(`Gumroad API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      return result as T;
    } catch (error) {
      logger.error({ error, endpoint, method }, 'Error making Gumroad API request');
      throw error;
    }
  }

  /**
   * Get a list of products from Gumroad
   */
  async getProducts(): Promise<GumroadProduct[]> {
    const response = await this.request<{success: boolean, products: GumroadProduct[]}>('/products');
    return response.products;
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(productId: string): Promise<GumroadProduct> {
    const response = await this.request<{success: boolean, product: GumroadProduct}>(`/products/${productId}`);
    return response.product;
  }

  /**
   * Get sales for a product
   */
  async getSales(productId?: string, limit = 10): Promise<GumroadSale[]> {
    const params: Record<string, any> = { limit };
    if (productId) {
      params.product_id = productId;
    }
    
    const response = await this.request<{success: boolean, sales: GumroadSale[]}>('/sales', 'GET', params);
    return response.sales;
  }

  /**
   * Create a new product
   */
  async createProduct(
    name: string, 
    price: number, 
    description?: string, 
    isPublished = true
  ): Promise<GumroadProduct> {
    const data = {
      name,
      price,
      description,
      published: isPublished
    };
    
    const response = await this.request<{success: boolean, product: GumroadProduct}>('/products', 'POST', data);
    return response.product;
  }
} 