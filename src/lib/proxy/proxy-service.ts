import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
}

/**
 * Service for managing proxy connections for platform integrations
 * that require geo-spoofing or IP rotation
 */
export class ProxyService {
  private proxies: ProxyConfig[] = [];
  private currentProxyIndex: number = 0;
  private brightDataEnabled: boolean = false;
  private openVpnEnabled: boolean = false;

  constructor() {
    this.brightDataEnabled = process.env.USE_BRIGHTDATA === 'true';
    this.openVpnEnabled = process.env.USE_OPENVPN === 'true';
    this.loadProxies();
  }

  /**
   * Load available proxies from environment or external service
   */
  private loadProxies(): void {
    // In production, this would load proxies from BrightData, OpenVPN, or other sources
    // For now, we'll use a simple placeholder setup
    if (this.brightDataEnabled) {
      this.proxies.push({
        host: process.env.BRIGHTDATA_HOST || 'brd.superproxy.io',
        port: parseInt(process.env.BRIGHTDATA_PORT || '22225'),
        username: process.env.BRIGHTDATA_USERNAME,
        password: process.env.BRIGHTDATA_PASSWORD,
        protocol: 'https' as const,
        country: 'US'
      });
    }

    // Add any additional manually configured proxies
    const manualProxies = process.env.MANUAL_PROXIES ? 
      JSON.parse(process.env.MANUAL_PROXIES) : [];
    
    this.proxies = [...this.proxies, ...manualProxies];
  }

  /**
   * Get the next proxy in rotation
   */
  public getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * Create an axios instance configured with a proxy
   */
  public createProxiedAxios(baseConfig: AxiosRequestConfig = {}): AxiosInstance {
    const axiosInstance = axios.create(baseConfig);
    
    // Add request interceptor to apply proxy to each request
    axiosInstance.interceptors.request.use(async (config) => {
      const proxy = this.getNextProxy();
      
      if (proxy) {
        config.proxy = {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username && proxy.password ? 
            { username: proxy.username, password: proxy.password } : 
            undefined,
          protocol: proxy.protocol
        };
      }
      
      return config;
    });

    // Add response interceptor for retry logic
    axiosInstance.interceptors.response.use(
      response => response,
      async (error) => {
        const config = error.config;
        
        // Retry logic for proxy-related errors
        if (
          (error.code === 'ECONNABORTED' || 
           error.response?.status === 403 ||
           error.response?.status === 429) && 
          (!config._retryCount || config._retryCount < 3)
        ) {
          config._retryCount = config._retryCount ? config._retryCount + 1 : 1;
          
          // Wait before retrying (exponential backoff)
          const delay = config._retryCount * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Get a new proxy for the retry
          const proxy = this.getNextProxy();
          if (proxy) {
            config.proxy = {
              host: proxy.host,
              port: proxy.port,
              auth: proxy.username && proxy.password ? 
                { username: proxy.username, password: proxy.password } : 
                undefined,
              protocol: proxy.protocol
            };
          }
          
          return axiosInstance(config);
        }
        
        return Promise.reject(error);
      }
    );
    
    return axiosInstance;
  }
  
  /**
   * Test if a proxy is working
   */
  public async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username && proxy.password ? 
            { username: proxy.username, password: proxy.password } : 
            undefined,
          protocol: proxy.protocol
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Proxy test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const proxyService = new ProxyService(); 