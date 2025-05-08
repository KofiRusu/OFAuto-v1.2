import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useAutomationStore, Automation, AutomationTask } from './useAutomationStore';
import { toast } from 'sonner';

const API_URL = '/api/automations';

// API functions
async function fetchAutomations(clientId?: string) {
  const queryParams = new URLSearchParams();
  if (clientId) queryParams.append('clientId', clientId);
  
  const response = await fetch(`${API_URL}?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch automations');
  }
  return response.json();
}

async function fetchAutomation(id: string) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch automation');
  }
  return response.json();
}

async function createAutomation(data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create automation');
  }
  
  return response.json();
}

async function updateAutomation(id: string, data: Partial<Automation>) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update automation');
  }
  
  return response.json();
}

async function deleteAutomation(id: string) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete automation');
  }
  
  return response.json();
}

async function executeAutomation(id: string) {
  const response = await fetch(`${API_URL}/${id}/execute`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to execute automation');
  }
  
  return response.json();
}

async function fetchTasks(automationId?: string) {
  const queryParams = new URLSearchParams();
  if (automationId) queryParams.append('automationId', automationId);
  
  const response = await fetch(`${API_URL}/tasks?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch automation tasks');
  }
  return response.json();
}

export function useAutomations(clientId?: string) {
  const queryClient = useQueryClient();
  const socket = useWebSocket();
  const automationStore = useAutomationStore();
  const {
    setAutomations,
    addAutomation,
    updateAutomation: updateAutomationInStore,
    removeAutomation,
    setTasks,
    updateTask: updateTaskInStore,
  } = automationStore;

  // Fetch automations query
  const automationsQuery = useQuery({
    queryKey: ['automations', clientId],
    queryFn: () => fetchAutomations(clientId),
    onSuccess: (data) => {
      setAutomations(data);
    },
  });

  // Fetch single automation
  const fetchSingleAutomation = useMutation({
    mutationFn: fetchAutomation,
    onSuccess: (data) => {
      // Update the specific automation in the cache
      queryClient.setQueryData(['automation', data.id], data);
      // Update in store if it exists
      updateAutomationInStore(data.id, data);
    },
  });

  // Create automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: createAutomation,
    onSuccess: (data) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      // Update store
      addAutomation(data);
      // Show success message
      toast.success('Automation created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create automation: ${error.message}`);
    },
  });

  // Update automation mutation
  const updateAutomationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Automation> }) => 
      updateAutomation(id, data),
    onSuccess: (data) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.setQueryData(['automation', data.id], data);
      // Update store
      updateAutomationInStore(data.id, data);
      // Show success message
      toast.success('Automation updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update automation: ${error.message}`);
    },
  });

  // Delete automation mutation
  const deleteAutomationMutation = useMutation({
    mutationFn: deleteAutomation,
    onSuccess: (_, variables) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.removeQueries({ queryKey: ['automation', variables] });
      // Update store
      removeAutomation(variables);
      // Show success message
      toast.success('Automation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete automation: ${error.message}`);
    },
  });

  // Execute automation mutation
  const executeAutomationMutation = useMutation({
    mutationFn: executeAutomation,
    onSuccess: (data, variables) => {
      // Invalidate tasks queries since new tasks will be created
      queryClient.invalidateQueries({ queryKey: ['automation-tasks'] });
      // Show success message
      toast.success('Automation executed successfully');
      // Refresh the automation to get updated lastTriggeredAt
      fetchSingleAutomation.mutate(variables);
    },
    onError: (error: Error) => {
      toast.error(`Failed to execute automation: ${error.message}`);
    },
  });

  // Fetch tasks query
  const tasksQuery = useQuery({
    queryKey: ['automation-tasks', clientId],
    queryFn: () => fetchTasks(clientId),
    onSuccess: (data) => {
      setTasks(data.tasks);
    },
  });

  // WebSocket event handlers
  React.useEffect(() => {
    if (!socket) return;

    // Handle automation created event
    const handleAutomationCreated = (event: { automation: Automation }) => {
      if (clientId && event.automation.clientId !== clientId) return;
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      // Update store
      addAutomation(event.automation);
      // Show notification
      toast('New automation created');
    };
    
    // Handle automation updated event
    const handleAutomationUpdated = (event: { automation: Automation }) => {
      if (clientId && event.automation.clientId !== clientId) return;
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.setQueryData(['automation', event.automation.id], event.automation);
      // Update store
      updateAutomationInStore(event.automation.id, event.automation);
    };
    
    // Handle automation deleted event
    const handleAutomationDeleted = (event: { automationId: string }) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.removeQueries({ queryKey: ['automation', event.automationId] });
      // Update store
      removeAutomation(event.automationId);
    };
    
    // Handle automation executed event
    const handleAutomationExecuted = (event: { 
      automationId: string; 
      taskIds: string[]; 
      executedAt: string 
    }) => {
      // Invalidate tasks queries
      queryClient.invalidateQueries({ queryKey: ['automation-tasks'] });
      // Refresh the automation to get updated lastTriggeredAt
      fetchSingleAutomation.mutate(event.automationId);
      // Show notification
      toast('Automation executed');
    };
    
    // Handle task update event
    const handleTaskUpdated = (event: { task: AutomationTask }) => {
      // Update tasks in cache and store
      queryClient.invalidateQueries({ queryKey: ['automation-tasks'] });
      updateTaskInStore(event.task.id, event.task);
      
      // Show notifications for completed or failed tasks
      if (event.task.status === 'completed') {
        toast.success(`Task completed: ${event.task.title}`);
      } else if (event.task.status === 'failed') {
        toast.error(`Task failed: ${event.task.title}`);
      }
    };

    // Subscribe to WebSocket events
    socket.on('automation_created', handleAutomationCreated);
    socket.on('automation_updated', handleAutomationUpdated);
    socket.on('automation_deleted', handleAutomationDeleted);
    socket.on('automation_executed', handleAutomationExecuted);
    socket.on('task_updated', handleTaskUpdated);

    // Cleanup
    return () => {
      socket.off('automation_created', handleAutomationCreated);
      socket.off('automation_updated', handleAutomationUpdated);
      socket.off('automation_deleted', handleAutomationDeleted);
      socket.off('automation_executed', handleAutomationExecuted);
      socket.off('task_updated', handleTaskUpdated);
    };
  }, [socket, clientId, queryClient, addAutomation, updateAutomationInStore, removeAutomation, updateTaskInStore]);

  return {
    // Queries
    automations: automationsQuery.data || [],
    isLoadingAutomations: automationsQuery.isLoading,
    automationsError: automationsQuery.error,
    tasks: tasksQuery.data?.tasks || [],
    isLoadingTasks: tasksQuery.isLoading,
    tasksError: tasksQuery.error,
    
    // Mutations
    createAutomation: createAutomationMutation.mutate,
    updateAutomation: ({ id, data }: { id: string; data: Partial<Automation> }) => 
      updateAutomationMutation.mutate({ id, data }),
    deleteAutomation: deleteAutomationMutation.mutate,
    executeAutomation: executeAutomationMutation.mutate,
    fetchAutomation: fetchSingleAutomation.mutate,
    
    // Mutation states
    isCreating: createAutomationMutation.isPending,
    isUpdating: updateAutomationMutation.isPending,
    isDeleting: deleteAutomationMutation.isPending,
    isExecuting: executeAutomationMutation.isPending,
    
    // Store state
    ...automationStore,
  };
} 