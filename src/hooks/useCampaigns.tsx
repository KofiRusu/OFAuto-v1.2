import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import axios from 'axios';
import { toast } from 'sonner';

export type CampaignMetrics = {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  cost?: number;
  roi?: number;
  ctr?: number;
  conversionRate?: number;
  engagements?: number;
  reach?: number;
  platformMetrics?: Record<string, any>;
  lastUpdated?: string;
};

export type Campaign = {
  id: string;
  name: string;
  description?: string;
  platform: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  clientId: string;
  userId: string;
  metrics: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
  abTest?: boolean;
  abTestVariant?: string;
  abTestParentId?: string;
};

type CampaignFilter = {
  clientId?: string;
  platform?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
};

type CreateCampaignData = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics'> & {
  metrics?: Partial<CampaignMetrics>;
};

type UpdateCampaignData = Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>> & {
  metrics?: Partial<CampaignMetrics>;
};

export const useCampaigns = (initialFilters: CampaignFilter = {}) => {
  const [filters, setFilters] = useState<CampaignFilter>(initialFilters);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useWebSocket();

  // Fetch campaigns with filters
  const {
    data: campaigns = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await axios.get(`/api/campaigns?${params.toString()}`);
      return response.data;
    }
  });

  // Get single campaign
  const useGetCampaign = (id: string) => {
    return useQuery({
      queryKey: ['campaign', id],
      queryFn: async () => {
        const response = await axios.get(`/api/campaigns/${id}`);
        return response.data;
      },
      enabled: !!id
    });
  };

  // Create campaign
  const createCampaign = useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const response = await axios.post('/api/campaigns', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    }
  });

  // Update campaign
  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCampaignData & { id: string }) => {
      const response = await axios.put(`/api/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    }
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/campaigns/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    }
  });

  // Update campaign metrics
  const updateCampaignMetrics = useMutation({
    mutationFn: async ({ id, metrics }: { id: string; metrics: Partial<CampaignMetrics> }) => {
      const response = await axios.patch(`/api/campaigns/${id}/metrics`, metrics);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
      toast.success('Campaign metrics updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update metrics');
    }
  });

  // Create A/B test variant
  const createABTestVariant = useMutation({
    mutationFn: async ({ parentId, variantData }: { parentId: string; variantData: CreateCampaignData }) => {
      // Add A/B test variant flags
      const abTestData = {
        ...variantData,
        abTest: true,
        abTestVariant: `Variant-${new Date().getTime().toString().slice(-4)}`,
        abTestParentId: parentId
      };
      
      const response = await axios.post('/api/campaigns', abTestData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('A/B test variant created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create A/B test variant');
    }
  });

  // WebSocket event handlers
  const handleCampaignCreated = useCallback((data: Campaign) => {
    queryClient.setQueryData(['campaigns'], (oldData: Campaign[] = []) => {
      // Check if campaign already exists in cache
      if (oldData.some(campaign => campaign.id === data.id)) {
        return oldData;
      }
      return [...oldData, data];
    });
    toast.info(`New campaign created: ${data.name}`);
  }, [queryClient]);

  const handleCampaignUpdated = useCallback((data: Campaign) => {
    queryClient.setQueryData(['campaigns'], (oldData: Campaign[] = []) => {
      return oldData.map(campaign => 
        campaign.id === data.id ? { ...campaign, ...data } : campaign
      );
    });
    
    // Also update individual campaign cache
    queryClient.setQueryData(['campaign', data.id], (oldData: Campaign | undefined) => {
      if (!oldData) return data;
      return { ...oldData, ...data };
    });
  }, [queryClient]);

  const handleCampaignDeleted = useCallback((data: { id: string; name: string }) => {
    queryClient.setQueryData(['campaigns'], (oldData: Campaign[] = []) => {
      return oldData.filter(campaign => campaign.id !== data.id);
    });
    
    // Remove individual campaign from cache
    queryClient.removeQueries({ queryKey: ['campaign', data.id] });
  }, [queryClient]);

  const handleCampaignMetricsUpdated = useCallback((data: { campaignId: string; metrics: CampaignMetrics }) => {
    // Update campaign in campaigns list
    queryClient.setQueryData(['campaigns'], (oldData: Campaign[] = []) => {
      return oldData.map(campaign => 
        campaign.id === data.campaignId 
          ? { ...campaign, metrics: { ...campaign.metrics, ...data.metrics } } 
          : campaign
      );
    });
    
    // Update individual campaign cache
    queryClient.setQueryData(['campaign', data.campaignId], (oldData: Campaign | undefined) => {
      if (!oldData) return undefined;
      return { 
        ...oldData, 
        metrics: { ...oldData.metrics, ...data.metrics } 
      };
    });
  }, [queryClient]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('campaign:created', handleCampaignCreated);
      socket.on('campaign:updated', handleCampaignUpdated);
      socket.on('campaign:deleted', handleCampaignDeleted);
      socket.on('campaign:metrics:updated', handleCampaignMetricsUpdated);
      
      return () => {
        socket.off('campaign:created', handleCampaignCreated);
        socket.off('campaign:updated', handleCampaignUpdated);
        socket.off('campaign:deleted', handleCampaignDeleted);
        socket.off('campaign:metrics:updated', handleCampaignMetricsUpdated);
      };
    }
  }, [
    socket, 
    isConnected, 
    handleCampaignCreated, 
    handleCampaignUpdated, 
    handleCampaignDeleted, 
    handleCampaignMetricsUpdated
  ]);

  // Filter handlers
  const updateFilters = useCallback((newFilters: Partial<CampaignFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    campaigns,
    isLoading,
    error,
    refetch,
    filters,
    updateFilters,
    resetFilters,
    useGetCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignMetrics,
    createABTestVariant
  };
};

export default useCampaigns; 