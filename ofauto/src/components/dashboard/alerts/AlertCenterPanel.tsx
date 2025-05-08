'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BellPlus, BellRing, BellOff, ListFilter, CheckCircle, Trash2 } from "lucide-react";
import { Platform } from "@/lib/types"; // Assuming shared type
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

import AlertRuleCard from './AlertRuleCard';
import AlertRuleEditor from './AlertRuleEditor';
import AlertHistoryFeed, { AlertHistoryEntry } from './AlertHistoryFeed';

// --- Types ---
export interface AlertRule {
  id: string;
  platform: Platform | 'all';
  metric: string; // e.g., 'engagement_rate'
  condition: 'drops_below' | 'increases_above' | 'equals';
  threshold: number;
  timeframe: 'last_hour' | 'last_day' | 'last_week';
  channels: string[]; // e.g., ['in_app', 'email']
  isEnabled: boolean;
  lastChecked?: Date;
  lastTriggered?: Date;
}

// --- Main Component ---
export default function AlertCenterPanel() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' or 'history'
  
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Load data on mount
  useEffect(() => {
    loadRules();
    loadHistory();
  }, [retryCount]);

  async function loadRules() {
    setIsLoadingRules(true);
    try {
      // Use apiClient to fetch alert rules
      const response = await apiClient.alerts.list();
      
      if (response.success && response.data) {
        setRules(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch alert rules");
      }
    } catch (error: any) {
      toast.error("Failed to load alert rules: " + (error.message || "Unknown error"));
      
      // Implement minimal retry logic
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000); // retry after 3 seconds
      }
    } finally {
      setIsLoadingRules(false);
    }
  }
  
  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      // Use apiClient to fetch alert history
      const response = await apiClient.alerts.history();
      
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch alert history");
      }
    } catch (error: any) {
      toast.error("Failed to load alert history: " + (error.message || "Unknown error"));
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const handleSaveRule = async (ruleData: Omit<AlertRule, 'id' | 'lastChecked' | 'lastTriggered'>) => {
    try {
      // Use apiClient to save an alert rule
      const response = await apiClient.alerts.create(ruleData);
      
      if (response.success && response.data) {
        setRules(prev => {
          const index = prev.findIndex(r => r.id === response.data.id);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = response.data;
            return updated;
          } else {
            return [response.data, ...prev];
          }
        });
        
        toast.success(ruleData.id ? "Rule updated successfully" : "New rule created successfully");
      } else {
        throw new Error(response.error || "Failed to save alert rule");
      }
    } catch (error: any) {
      toast.error("Failed to save rule: " + (error.message || "Unknown error"));
      throw error; // Re-throw to keep modal open
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;
    setDeletingId(id);
    try {
      // Use apiClient to delete an alert rule
      const response = await apiClient.alerts.delete(id);
      
      if (response.success) {
        setRules(prev => prev.filter(r => r.id !== id));
        toast.success("Alert rule deleted successfully");
      } else {
        throw new Error(response.error || "Failed to delete alert rule");
      }
    } catch (error: any) {
      toast.error("Failed to delete rule: " + (error.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleRule = async (id: string, isEnabled: boolean) => {
    setTogglingId(id);
    try {
      // Use apiClient to toggle an alert rule
      const response = await apiClient.alerts.toggle(id, isEnabled);
      
      if (response.success) {
        setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled } : r));
        toast.success(isEnabled ? "Rule enabled successfully" : "Rule disabled successfully");
      } else {
        throw new Error(response.error || "Failed to toggle alert rule");
      }
    } catch (error: any) {
      toast.error("Failed to toggle rule: " + (error.message || "Unknown error"));
      // Revert UI state on failure
      setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !isEnabled } : r));
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEditor = (rule: AlertRule | null = null) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };
  
  const isLoading = isLoadingRules || isLoadingHistory;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alert Center</h1>
          <p className="text-muted-foreground">Configure and monitor platform alerts.</p>
        </div>
        <Button onClick={() => handleOpenEditor()}> 
          <BellPlus className="mr-2 h-4 w-4" />
          Create New Alert Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Trigger History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          {isLoadingRules ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : rules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map(rule => (
                <AlertRuleCard 
                  key={rule.id} 
                  rule={rule} 
                  onToggle={handleToggleRule}
                  onEdit={handleOpenEditor}
                  onDelete={handleDeleteRule}
                  isToggling={togglingId === rule.id}
                  isDeleting={deletingId === rule.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg bg-muted/20">
              <BellOff className="mx-auto h-12 w-12 text-muted-foreground"/>
              <p className="mt-4 text-muted-foreground">
                You haven't configured any alert rules yet.
              </p>
              <Button onClick={() => handleOpenEditor()} className="mt-4">
                Create Your First Alert
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <AlertHistoryFeed history={history} isLoading={isLoadingHistory} />
        </TabsContent>
      </Tabs>

      {/* Editor Modal */}
      <AlertRuleEditor 
        rule={editingRule}
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handleSaveRule}
      />
    </div>
  );
} 