import { create } from 'zustand';
import { TriggerType } from '../orchestration/triggerEngine';

export interface AutomationAction {
  type: string;
  platform: string;
  params: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
  scheduledTime?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  clientId: string;
  triggerType: TriggerType;
  conditions: Record<string, any>;
  actions: AutomationAction[];
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTask {
  id: string;
  automationId: string;
  title: string;
  description: string;
  actionType: string;
  platform: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: Record<string, any>;
  error?: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationStore {
  // Automations state
  automations: Automation[];
  selectedAutomation: Automation | null;
  isLoading: boolean;
  error: string | null;
  
  // Tasks state
  tasks: AutomationTask[];
  selectedTask: AutomationTask | null;
  isTasksLoading: boolean;
  tasksError: string | null;
  
  // Actions
  setAutomations: (automations: Automation[]) => void;
  setSelectedAutomation: (automation: Automation | null) => void;
  addAutomation: (automation: Automation) => void;
  updateAutomation: (id: string, data: Partial<Automation>) => void;
  removeAutomation: (id: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Task actions
  setTasks: (tasks: AutomationTask[]) => void;
  setSelectedTask: (task: AutomationTask | null) => void;
  updateTask: (id: string, data: Partial<AutomationTask>) => void;
  setIsTasksLoading: (isLoading: boolean) => void;
  setTasksError: (error: string | null) => void;
  
  // UI state
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isTaskDetailsModalOpen: boolean;
  
  // UI actions
  setCreateModalOpen: (isOpen: boolean) => void;
  setEditModalOpen: (isOpen: boolean) => void;
  setDeleteModalOpen: (isOpen: boolean) => void;
  setTaskDetailsModalOpen: (isOpen: boolean) => void;
}

export const useAutomationStore = create<AutomationStore>((set) => ({
  // Initial state
  automations: [],
  selectedAutomation: null,
  isLoading: false,
  error: null,
  
  tasks: [],
  selectedTask: null,
  isTasksLoading: false,
  tasksError: null,
  
  // UI state
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isTaskDetailsModalOpen: false,
  
  // Automation actions
  setAutomations: (automations) => set({ automations }),
  setSelectedAutomation: (automation) => set({ selectedAutomation: automation }),
  addAutomation: (automation) => set((state) => ({ 
    automations: [...state.automations, automation] 
  })),
  updateAutomation: (id, data) => set((state) => ({
    automations: state.automations.map((automation) => 
      automation.id === id 
        ? { ...automation, ...data } 
        : automation
    ),
    selectedAutomation: state.selectedAutomation?.id === id 
      ? { ...state.selectedAutomation, ...data } 
      : state.selectedAutomation
  })),
  removeAutomation: (id) => set((state) => ({
    automations: state.automations.filter((automation) => automation.id !== id),
    selectedAutomation: state.selectedAutomation?.id === id 
      ? null 
      : state.selectedAutomation
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Task actions
  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  updateTask: (id, data) => set((state) => ({
    tasks: state.tasks.map((task) => 
      task.id === id 
        ? { ...task, ...data } 
        : task
    ),
    selectedTask: state.selectedTask?.id === id 
      ? { ...state.selectedTask, ...data } 
      : state.selectedTask
  })),
  setIsTasksLoading: (isLoading) => set({ isTasksLoading: isLoading }),
  setTasksError: (error) => set({ tasksError: error }),
  
  // UI actions
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  setEditModalOpen: (isOpen) => set({ isEditModalOpen: isOpen }),
  setDeleteModalOpen: (isOpen) => set({ isDeleteModalOpen: isOpen }),
  setTaskDetailsModalOpen: (isOpen) => set({ isTaskDetailsModalOpen: isOpen }),
})); 