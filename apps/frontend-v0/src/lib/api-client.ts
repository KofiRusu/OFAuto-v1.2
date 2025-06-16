import type { User, ApiResponse as ApiResponseType } from '@ofauto/types';

// API Client for communicating with the backend
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponseType<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getUsers(): Promise<ApiResponseType<User[]>> {
    return this.request<User[]>('/api/users');
  }

  async getHealth() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;