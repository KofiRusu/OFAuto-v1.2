import axios from 'axios';
import { prisma } from '@/lib/db/prisma';

/**
 * Interface for proxy configuration
 */
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  region?: string;
  city?: string;
}

/**
 * Manager for handling proxy connections and geo-spoofing
 */
export class ProxyManager {
  private brightDataApiKey: string | null = null;
  private proxyPool: ProxyConfig[] = [];
  private countriesMap: Map<string, ProxyConfig[]> = new Map();
  private regionMap: Map<string, ProxyConfig[]> = new Map();

  constructor() {
    this.brightDataApiKey = process.env.BRIGHTDATA_API_KEY || null;
    this.initializeProxyPool();
  }

  /**
   * Initialize the proxy pool
   * In a real implementation, this would fetch available proxies from providers
   */
  private async initializeProxyPool() {
    if (this.brightDataApiKey) {
      await this.fetchBrightDataProxies();
    } else {
      // Fallback to manually configured proxies
      this.loadLocalProxyConfiguration();
    }

    // Index proxies by location for quick lookup
    this.indexProxiesByLocation();
  }

  /**
   * Fetch proxies from BrightData API
   */
  private async fetchBrightDataProxies() {
    try {
      if (!this.brightDataApiKey) return;

      // This is a placeholder - in a real implementation, this would call the BrightData API
      // to fetch available proxies
      console.log('Fetching proxies from BrightData');
      
      // Sample proxy data
      this.proxyPool = [
        {
          host: 'us-pr.oxylabs.io',
          port: 7777,
          username: 'customer-username',
          password: 'customer-password',
          protocol: 'https' as const,
          country: 'US',
          region: 'New York',
        },
        {
          host: 'uk-pr.oxylabs.io',
          port: 7777,
          username: 'customer-username',
          password: 'customer-password',
          protocol: 'https' as const,
          country: 'UK',
          region: 'London',
        },
      ];
    } catch (error) {
      console.error('Error fetching BrightData proxies:', error);
      // Fallback to local configuration
      this.loadLocalProxyConfiguration();
    }
  }

  /**
   * Load proxies from local configuration
   */
  private loadLocalProxyConfiguration() {
    // This would typically load from a config file or database
    this.proxyPool = [
      {
        host: 'proxy-us.example.com',
        port: 8080,
        protocol: 'https' as const,
        country: 'US',
        region: 'California',
        city: 'Los Angeles',
      },
      {
        host: 'proxy-uk.example.com',
        port: 8080,
        protocol: 'https' as const,
        country: 'UK',
        region: 'England',
        city: 'London',
      },
      {
        host: 'proxy-jp.example.com',
        port: 8080,
        protocol: 'https' as const,
        country: 'JP',
        region: 'Tokyo',
      },
    ];
  }

  /**
   * Index proxies by location for quick lookup
   */
  private indexProxiesByLocation() {
    this.countriesMap.clear();
    this.regionMap.clear();

    for (const proxy of this.proxyPool) {
      if (proxy.country) {
        if (!this.countriesMap.has(proxy.country)) {
          this.countriesMap.set(proxy.country, []);
        }
        this.countriesMap.get(proxy.country)!.push(proxy);
      }

      if (proxy.region) {
        const regionKey = `${proxy.country || ''}-${proxy.region}`;
        if (!this.regionMap.has(regionKey)) {
          this.regionMap.set(regionKey, []);
        }
        this.regionMap.get(regionKey)!.push(proxy);
      }
    }
  }

  /**
   * Get a proxy by country
   */
  getProxyByCountry(country: string): ProxyConfig | null {
    const countryProxies = this.countriesMap.get(country);
    if (!countryProxies || countryProxies.length === 0) {
      return null;
    }

    // Get a random proxy from the country pool
    return countryProxies[Math.floor(Math.random() * countryProxies.length)];
  }

  /**
   * Get a proxy by region
   */
  getProxyByRegion(country: string, region: string): ProxyConfig | null {
    const regionKey = `${country}-${region}`;
    const regionProxies = this.regionMap.get(regionKey);
    if (!regionProxies || regionProxies.length === 0) {
      return this.getProxyByCountry(country);
    }

    // Get a random proxy from the region pool
    return regionProxies[Math.floor(Math.random() * regionProxies.length)];
  }

  /**
   * Get a random proxy from the pool
   */
  getRandomProxy(): ProxyConfig | null {
    if (this.proxyPool.length === 0) {
      return null;
    }

    return this.proxyPool[Math.floor(Math.random() * this.proxyPool.length)];
  }

  /**
   * Test a proxy connection
   */
  async testProxyConnection(proxy: ProxyConfig): Promise<boolean> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username && proxy.password
            ? { username: proxy.username, password: proxy.password }
            : undefined,
          protocol: proxy.protocol,
        },
        timeout: 5000, // 5 second timeout
      });

      return response.status === 200;
    } catch (error) {
      console.error('Proxy connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available countries
   */
  getAvailableCountries(): string[] {
    return Array.from(this.countriesMap.keys());
  }

  /**
   * Get available regions for a country
   */
  getAvailableRegions(country: string): string[] {
    const regions = new Set<string>();
    
    this.proxyPool
      .filter(proxy => proxy.country === country && proxy.region)
      .forEach(proxy => {
        if (proxy.region) {
          regions.add(proxy.region);
        }
      });
      
    return Array.from(regions);
  }

  /**
   * Save proxy configuration for a content item
   */
  async saveGeoTargeting(contentId: string, config: {
    country?: string;
    region?: string;
    city?: string;
    proxyServer?: string;
  }): Promise<boolean> {
    try {
      await prisma.geoTargeting.create({
        data: {
          country: config.country,
          region: config.region,
          city: config.city,
          proxyServer: config.proxyServer,
          contentId: contentId,
        },
      });
      
      return true;
    } catch (error) {
      console.error('Error saving geo targeting:', error);
      return false;
    }
  }

  /**
   * Get geo targeting for a content item
   */
  async getGeoTargeting(contentId: string): Promise<any> {
    try {
      return await prisma.geoTargeting.findFirst({
        where: { contentId },
      });
    } catch (error) {
      console.error('Error getting geo targeting:', error);
      return null;
    }
  }
} 