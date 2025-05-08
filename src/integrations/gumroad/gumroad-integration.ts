import {
  AnalyticsResult,
  AuthResult,
  BasePlatformIntegration,
  PostPayload,
  PostResult,
  ActivityResult
} from '../BasePlatformIntegration';
import { GumroadAuth, GumroadConfig } from './gumroad-auth';
import fetch from 'node-fetch';

const GUMROAD_API_BASE = 'https://api.gumroad.com/v2';

export class GumroadIntegration implements BasePlatformIntegration {
  private auth: GumroadAuth;
  private accessToken: string | null = null;
  
  constructor(config: GumroadConfig) {
    this.auth = new GumroadAuth(config);
    this.accessToken = config.accessToken || null;
  }
  
  /**
   * Authenticate with Gumroad
   * @param code Authorization code from OAuth flow
   */
  async authenticate(code: string): Promise<AuthResult> {
    const authResult = await this.auth.getAccessToken(code);
    if (authResult.successful) {
      this.accessToken = authResult.accessToken;
    }
    return authResult;
  }
  
  /**
   * Fetch analytics from Gumroad (sales, products, customers)
   */
  async fetchStats(): Promise<AnalyticsResult> {
    if (!this.accessToken) {
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: 'Not authenticated with Gumroad'
      };
    }
    
    try {
      // Get products (tiers)
      const productsResponse = await fetch(`${GUMROAD_API_BASE}/products`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!productsResponse.ok) {
        return {
          followers: 0,
          totalIncome: 0,
          currency: 'USD',
          tierBreakdown: [],
          lastUpdated: new Date(),
          error: `Failed to fetch Gumroad products: ${productsResponse.status}`
        };
      }
      
      const productsData = await productsResponse.json() as any;
      
      // Get sales data
      const salesResponse = await fetch(`${GUMROAD_API_BASE}/sales`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!salesResponse.ok) {
        return {
          followers: 0,
          totalIncome: 0,
          currency: 'USD',
          tierBreakdown: [],
          lastUpdated: new Date(),
          error: `Failed to fetch Gumroad sales: ${salesResponse.status}`
        };
      }
      
      const salesData = await salesResponse.json() as any;
      
      // Calculate total income
      let totalIncome = 0;
      const customerCount = new Set();
      
      // Process sales data
      if (salesData.sales) {
        salesData.sales.forEach((sale: any) => {
          totalIncome += parseFloat(sale.price);
          customerCount.add(sale.email);
        });
      }
      
      // Process tier breakdown
      const tierBreakdown = [];
      if (productsData.products) {
        for (const product of productsData.products) {
          // Count number of sales for this product
          const supporterCount = salesData.sales ? 
            salesData.sales.filter((sale: any) => sale.product_id === product.id).length : 0;
          
          tierBreakdown.push({
            tierId: product.id,
            tierName: product.name,
            tierAmount: parseFloat(product.price),
            supporterCount
          });
        }
      }
      
      return {
        followers: customerCount.size,
        totalIncome,
        currency: 'USD', // Gumroad supports multiple currencies, defaulting to USD
        tierBreakdown,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching Gumroad stats:', error);
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Error fetching Gumroad stats: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Create a product update on Gumroad (similar to a post)
   * @param payload Post content and settings
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    if (!this.accessToken) {
      return {
        successful: false,
        error: 'Not authenticated with Gumroad'
      };
    }
    
    try {
      // Gumroad doesn't have direct "posts" but we can use product updates
      // First, we need to select a product to update (if tiers were specified)
      let productId = '';
      if (payload.tiers && payload.tiers.length > 0) {
        productId = payload.tiers[0]; // Use the first tier ID as the product ID
      } else {
        // Get the first product if no specific tier is specified
        const productsResponse = await fetch(`${GUMROAD_API_BASE}/products`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (!productsResponse.ok) {
          return {
            successful: false,
            error: `Failed to fetch Gumroad products: ${productsResponse.status}`
          };
        }
        
        const productsData = await productsResponse.json() as any;
        if (productsData.products && productsData.products.length > 0) {
          productId = productsData.products[0].id;
        } else {
          return {
            successful: false,
            error: 'No products found on Gumroad to post update to'
          };
        }
      }
      
      // Create the update
      const updateResponse = await fetch(`${GUMROAD_API_BASE}/products/${productId}/updates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          published: !payload.scheduledFor, // If scheduledFor is provided, don't publish immediately
          published_at: payload.scheduledFor ? new Date(payload.scheduledFor).toISOString() : undefined
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return {
          successful: false,
          error: `Failed to create Gumroad update: ${updateResponse.status} ${errorText}`
        };
      }
      
      const updateData = await updateResponse.json() as any;
      
      return {
        postId: updateData.update?.id,
        url: updateData.update?.url,
        successful: true,
        scheduledFor: payload.scheduledFor
      };
    } catch (error) {
      console.error('Error creating Gumroad post:', error);
      return {
        successful: false,
        error: `Error creating Gumroad post: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Poll for new activity on Gumroad (new sales, etc.)
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    if (!this.accessToken) {
      return [];
    }
    
    try {
      // Get recent sales
      const salesResponse = await fetch(`${GUMROAD_API_BASE}/sales?after=${new Date(Date.now() - 3600000).toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!salesResponse.ok) {
        console.error(`Failed to fetch recent Gumroad sales: ${salesResponse.status}`);
        return [];
      }
      
      const salesData = await salesResponse.json() as any;
      const activities: ActivityResult[] = [];
      
      if (salesData.sales) {
        for (const sale of salesData.sales) {
          activities.push({
            type: 'new_pledge',
            userId: sale.email,
            username: sale.full_name || sale.email,
            amount: parseFloat(sale.price),
            tierId: sale.product_id,
            tierName: sale.product_name,
            timestamp: new Date(sale.created_at),
            metadata: {
              saleId: sale.id,
              refunded: sale.refunded
            }
          });
        }
      }
      
      return activities;
    } catch (error) {
      console.error('Error polling Gumroad activity:', error);
      return [];
    }
  }
} 