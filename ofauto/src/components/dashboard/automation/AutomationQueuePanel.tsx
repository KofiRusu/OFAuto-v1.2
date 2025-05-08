'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ListChecks } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

import AutomationTaskCard from './AutomationTaskCard';
import TaskInspectorModal from './TaskInspectorModal';

// --- Types ---
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type Platform = 'onlyfans' | 'fansly' | 'patreon' | 'kofi' | 'instagram' | 'twitter';

export interface AutomationTask {
  id: string;
  platform: Platform;
  status: TaskStatus;
  type: string; // e.g., 'post', 'message', 'pricingUpdate'
  personaUsed?: string | null;
  strategyId?: string | null;
  payload?: Record<string, any>; // The data used for execution
  createdAt: Date;
  executedAt?: Date;
  errorLog?: string | null;
}

// --- Component --- 
const taskStatuses: TaskStatus[] = ['running', 'queued', 'failed', 'completed', 'cancelled'];
const platforms: Platform[] = ['onlyfans', 'fansly', 'patreon', 'kofi', 'instagram', 'twitter'];

export default function AutomationQueuePanel() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [inspectingTask, setInspectingTask] = useState<AutomationTask | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [retryCount]);

  async function loadTasks() {
    setIsLoading(true);
    try {
      // Prepare params for API call
      const params: Record<string, string> = {};
      
      if (selectedPlatform !== 'all') {
        params.platform = selectedPlatform;
      }
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Use apiClient to fetch queue tasks
      const response = await apiClient.queue.list(params);
      
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch automation tasks");
      }
    } catch (error: any) {
      toast.error("Could not load automation tasks: " + (error.message || "Unknown error"));
      
      // Implement minimal retry logic
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000); // retry after 3 seconds
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Refresh tasks when filters change
  useEffect(() => {
    if (!isLoading) { // Skip if initial load is still happening
      loadTasks();
    }
  }, [selectedPlatform, activeTab, searchTerm]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      // Use apiClient to retry a failed task
      const response = await apiClient.queue.retry(id);
      
      if (response.success && response.data) {
        // If the API returns the new task, add it to the list
        if (response.data.newTask) {
          setTasks(prev => [response.data.newTask!, ...prev.filter(t => t.id !== id)]);
        } else {
          // Otherwise just update the list
          await loadTasks();
        }
        
        toast.success("Task has been queued for retry");
      } else {
        throw new Error(response.error || "Failed to retry task");
      }
    } catch (error: any) {
      toast.error("Could not retry task: " + (error.message || "Unknown error"));
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      // Use apiClient to cancel a task
      const response = await apiClient.queue.cancel(id);
      
      if (response.success) {
        // Update the task status locally
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, status: 'cancelled' } : t
        ));
        
        toast.success("Task has been cancelled successfully");
      } else {
        throw new Error(response.error || "Failed to cancel task");
      }
    } catch (error: any) {
      toast.error("Could not cancel task: " + (error.message || "Unknown error"));
    } finally {
      setCancellingId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesTab = activeTab === 'all' || task.status === activeTab;
      const matchesPlatform = selectedPlatform === 'all' || task.platform === selectedPlatform;
      const matchesSearch = !searchTerm || 
                            task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.payload?.message?.toLowerCase().includes(searchTerm.toLowerCase()); 
                            // Add more searchable fields if needed
      return matchesTab && matchesPlatform && matchesSearch;
    });
  }, [tasks, activeTab, selectedPlatform, searchTerm]);

  const activeTaskCount = useMemo(() => tasks.filter(t => t.status === 'running' || t.status === 'queued').length, [tasks]);

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Automation Queue ({activeTaskCount} Active)</h2>
          <p className="text-muted-foreground text-sm">Monitor and manage all automated tasks.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform | 'all')}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Filter Platform..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search ID, type, payload..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TaskStatus | 'all')}>
        <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            {taskStatuses.map(status => (
                 <TabsTrigger key={status} value={status} className="capitalize">
                     {status}
                 </TabsTrigger>
             ))}
        </TabsList>

        {/* Task Grid (Content for all tabs) */}
        <div className="mt-4">
             {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
                 </div>
             ) : filteredTasks.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {filteredTasks.map(task => (
                     <AutomationTaskCard 
                         key={task.id} 
                         task={task} 
                         onRetry={handleRetry}
                         onCancel={handleCancel}
                         onInspect={setInspectingTask}
                         isRetrying={retryingId === task.id}
                         isCancelling={cancellingId === task.id}
                     />
                 ))}
                 </div>
             ) : (
                 <div className="text-center py-16 border rounded-lg bg-muted/20">
                     <ListChecks className="mx-auto h-12 w-12 text-muted-foreground"/>
                     <p className="mt-4 text-muted-foreground">
                        No tasks found matching the current filters.
                     </p>
                 </div>
             )}
         </div>
      </Tabs>
      
      {/* Inspector Modal */}
      <TaskInspectorModal 
        task={inspectingTask} 
        isOpen={!!inspectingTask} 
        onClose={() => setInspectingTask(null)} 
       />
    </div>
  );
} 