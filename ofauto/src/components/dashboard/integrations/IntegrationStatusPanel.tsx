'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, RefreshCcw, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

import IntegrationStatusCard from './IntegrationStatusCard';
import IntegrationConfigModal from './IntegrationConfigModal';

// --- Types ---

export type AuthType = 'apiKey' | 'session' | 'oauth';

export interface Integration {
  id: string;
  platform: string;
  username: string;
  status: 'active' | 'inactive';
  lastSync?: Date;
  connectedAt: Date;
  updatedAt: Date;
  errorMessage?: string | null;
}

// --- Main Component ---

export default function IntegrationStatusPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const response = await apiClient.integrations.getStatus();
      
      if (response.success && response.data) {
        setIntegrations(response.data.integrations || []);
      } else {
        throw new Error(response.error || "Failed to load integration status");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load integration statuses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleTest = async (id: string, platform: string) => {
    setTestingId(id);
    try {
      // Use apiClient to test the connection
      const response = await apiClient.integrations.testConnection(id);
      
      if (response.success) {
        toast.success(`Connection to ${platform} tested successfully!`);
        
        // Update the integration status to reflect success if needed
        setIntegrations(prev => 
          prev.map(i => i.id === id ? {...i, status: 'active', errorMessage: null } : i)
        );
      } else {
        toast.error(`Failed to connect to ${platform}: ${response.error || 'Please check your credentials'}`);
        
        // Update the integration status to reflect the failure
        setIntegrations(prev => 
          prev.map(i => i.id === id ? {...i, status: 'inactive', errorMessage: response.error || 'Connection test failed' } : i)
        );
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message || "Unknown error"}`);
      
      // Update status on error
      setIntegrations(prev => 
        prev.map(i => i.id === id ? {...i, status: 'inactive', errorMessage: error.message || 'Connection test failed' } : i)
      );
    } finally {
      setTestingId(null);
    }
  };
  
  const handleSaveSuccess = () => {
    loadStatus(); // Refresh the list after saving credentials
    toast.success("Integration updated successfully");
  };

  // Map integration.platform to human-readable name
  const getPlatformName = (platform: string): string => {
    const platformMap: Record<string, string> = {
      'onlyfans': 'OnlyFans',
      'fansly': 'Fansly',
      'patreon': 'Patreon',
      'kofi': 'Ko-fi',
      'instagram': 'Instagram',
      'twitter': 'Twitter/X',
      'google-drive': 'Google Drive',
    };
    
    return platformMap[platform] || platform;
  };

  // Transform the API data format to the component's expected format
  const transformedIntegrations = integrations.map(integration => ({
    ...integration,
    name: getPlatformName(integration.platform),
    connected: integration.status === 'active',
    authType: integration.platform.includes('fans') ? 'session' : 
              integration.platform.includes('google') ? 'oauth' : 'apiKey',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Platform Integrations</h1>
          <p className="text-muted-foreground">Manage connections to your content platforms and services.</p>
        </div>
        <Button variant="outline" onClick={loadStatus} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Integration Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : transformedIntegrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedIntegrations.map(integration => (
            <IntegrationStatusCard 
              key={integration.id} 
              integration={integration} 
              onConfigure={handleConfigure}
              onTest={() => handleTest(integration.id, integration.platform)}
              isTesting={testingId === integration.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground"/>
          <p className="mt-4 text-muted-foreground">
            No integrations found. Connect your first platform to get started.
          </p>
        </div>
      )}

      {/* Configuration Modal */}
      <IntegrationConfigModal 
        integration={selectedIntegration}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
} 