import { toast } from 'react-hot-toast';

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic fetch function with error handling
async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'An error occurred';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

// API client
const apiClient = {
  // Personas
  personas: {
    list: () => fetchApi<any[]>('/api/personas'),
    get: (id: string) => fetchApi<any>(`/api/personas/${id}`),
    create: (data: any) => fetchApi<any>('/api/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi<any>(`/api/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<any>(`/api/personas/${id}`, {
      method: 'DELETE',
    }),
  },

  // Integrations
  integrations: {
    getStatus: () => fetchApi<any>('/api/integrations/status'),
    connect: (platform: string, data: any) => fetchApi<any>(`/api/integrations/${platform}/auth`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Analytics
  analytics: {
    get: (params: Record<string, string> = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi<any>(`/api/analytics?${queryString}`);
    },
  },

  // Followers
  followers: {
    list: (params: Record<string, string> = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi<any>(`/api/followers?${queryString}`);
    },
    update: (id: string, data: any) => fetchApi<any>(`/api/followers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },

  // Messages
  messages: {
    list: (platformId: string, followerId: string) => 
      fetchApi<any>(`/api/messages?platformId=${platformId}&followerId=${followerId}`),
    send: (data: any) => fetchApi<any>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Scheduler
  scheduler: {
    list: (params: Record<string, string> = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi<any>(`/api/posts/schedule?${queryString}`);
    },
    create: (data: any) => fetchApi<any>('/api/posts/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Automation Queue
  queue: {
    list: (params: Record<string, string> = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi<any>(`/api/queue?${queryString}`);
    },
    retry: (taskId: string) => fetchApi<any>('/api/queue/retry', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),
    cancel: (taskId: string, reason?: string) => fetchApi<any>('/api/queue/cancel', {
      method: 'POST',
      body: JSON.stringify({ taskId, reason }),
    }),
  },

  // Strategies
  strategies: {
    list: (params: Record<string, string> = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchApi<any>(`/api/strategies?${queryString}`);
    },
    create: (data: any) => fetchApi<any>('/api/strategies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Alerts
  alerts: {
    list: () => fetchApi<any>('/api/alerts'),
    create: (data: any) => fetchApi<any>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
};

export default apiClient; 