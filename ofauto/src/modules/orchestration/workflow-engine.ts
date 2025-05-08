import { EventEmitter } from 'events';
import { prisma } from '@/lib/db/prisma';

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Task priority enum
 */
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  type: string;
  payload: any;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retries: number;
  maxRetries: number;
}

/**
 * Workflow Engine for orchestrating tasks across the system
 */
export class WorkflowEngine extends EventEmitter {
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private taskHandlers: Map<string, (task: Task) => Promise<any>> = new Map();
  private maxConcurrentTasks: number;
  private isProcessing: boolean = false;

  constructor(maxConcurrentTasks = 5) {
    super();
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers() {
    this.on('taskCompleted', (taskId: string, result: any) => {
      this.handleTaskCompletion(taskId, result);
    });

    this.on('taskFailed', (taskId: string, error: Error) => {
      this.handleTaskFailure(taskId, error);
    });
  }

  /**
   * Register a task handler
   */
  registerTaskHandler(taskType: string, handler: (task: Task) => Promise<any>) {
    this.taskHandlers.set(taskType, handler);
    console.log(`Registered handler for task type: ${taskType}`);
  }

  /**
   * Add a task to the queue
   */
  async addTask(
    type: string,
    payload: any,
    options: {
      priority?: TaskPriority;
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    if (!this.taskHandlers.has(type)) {
      throw new Error(`No handler registered for task type: ${type}`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const task: Task = {
      id: taskId,
      type,
      payload,
      status: TaskStatus.PENDING,
      priority: options.priority || TaskPriority.MEDIUM,
      dependencies: options.dependencies || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      retries: 0,
      maxRetries: options.maxRetries || 3,
    };

    this.taskQueue.push(task);
    this.sortTaskQueue();
    
    // Start processing if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Sort the task queue by priority and dependencies
   */
  private sortTaskQueue() {
    // Sort by priority first (higher priority first)
    const priorityOrder = {
      [TaskPriority.CRITICAL]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3,
    };

    this.taskQueue.sort((a, b) => {
      // First, check if task has dependencies that aren't completed
      const aHasPendingDeps = this.hasPendingDependencies(a);
      const bHasPendingDeps = this.hasPendingDependencies(b);

      if (aHasPendingDeps && !bHasPendingDeps) return 1;
      if (!aHasPendingDeps && bHasPendingDeps) return -1;

      // Then sort by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Check if a task has pending dependencies
   */
  private hasPendingDependencies(task: Task): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return false;
    }

    return task.dependencies.some(depId => {
      // Check if dependency is in running tasks
      if (this.runningTasks.has(depId)) {
        return true;
      }
      
      // Check if dependency is in queue
      return this.taskQueue.some(t => t.id === depId);
    });
  }

  /**
   * Process the task queue
   */
  private async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.taskQueue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
      this.sortTaskQueue();
      
      // Get the next eligible task
      const taskIndex = this.taskQueue.findIndex(task => !this.hasPendingDependencies(task));
      
      if (taskIndex === -1) {
        // No eligible tasks
        break;
      }
      
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      this.runningTasks.set(task.id, task);
      
      // Execute the task
      this.executeTask(task);
    }
    
    this.isProcessing = false;
    
    // If there are more tasks and capacity, process the queue again
    if (this.taskQueue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
      this.processQueue();
    }
  }

  /**
   * Execute a task
   */
  private async executeTask(task: Task) {
    const handler = this.taskHandlers.get(task.type);
    
    if (!handler) {
      this.emit('taskFailed', task.id, new Error(`No handler for task type: ${task.type}`));
      return;
    }
    
    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    task.updatedAt = new Date();
    
    try {
      console.log(`Executing task ${task.id} of type ${task.type}`);
      const result = await handler(task);
      this.emit('taskCompleted', task.id, result);
    } catch (error: any) {
      console.error(`Task ${task.id} failed:`, error);
      this.emit('taskFailed', task.id, error);
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskCompletion(taskId: string, result: any) {
    const task = this.runningTasks.get(taskId);
    
    if (!task) {
      console.error(`Task ${taskId} not found in running tasks`);
      return;
    }
    
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.updatedAt = new Date();
    
    this.runningTasks.delete(taskId);
    
    console.log(`Task ${taskId} completed successfully`);
    
    // Process the next task in the queue
    this.processQueue();
  }

  /**
   * Handle task failure
   */
  private handleTaskFailure(taskId: string, error: Error) {
    const task = this.runningTasks.get(taskId);
    
    if (!task) {
      console.error(`Task ${taskId} not found in running tasks`);
      return;
    }
    
    task.retries += 1;
    task.updatedAt = new Date();
    
    if (task.retries < task.maxRetries) {
      // Retry the task
      console.log(`Retrying task ${taskId} (attempt ${task.retries + 1}/${task.maxRetries})`);
      task.status = TaskStatus.PENDING;
      this.taskQueue.push(task);
    } else {
      // Mark the task as failed
      task.status = TaskStatus.FAILED;
      task.error = error.message;
      console.error(`Task ${taskId} failed after ${task.retries} retries: ${error.message}`);
    }
    
    this.runningTasks.delete(taskId);
    
    // Process the next task in the queue
    this.processQueue();
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    // Check if the task is in the queue
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId);
    
    if (queueIndex !== -1) {
      const task = this.taskQueue[queueIndex];
      task.status = TaskStatus.CANCELLED;
      this.taskQueue.splice(queueIndex, 1);
      console.log(`Task ${taskId} cancelled from queue`);
      return true;
    }
    
    // Check if the task is running
    if (this.runningTasks.has(taskId)) {
      const task = this.runningTasks.get(taskId)!;
      task.status = TaskStatus.CANCELLED;
      this.runningTasks.delete(taskId);
      console.log(`Running task ${taskId} marked as cancelled`);
      return true;
    }
    
    return false;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    // Check running tasks
    if (this.runningTasks.has(taskId)) {
      return this.runningTasks.get(taskId)!.status;
    }
    
    // Check queue
    const queuedTask = this.taskQueue.find(task => task.id === taskId);
    if (queuedTask) {
      return queuedTask.status;
    }
    
    return null;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return [
      ...Array.from(this.runningTasks.values()),
      ...this.taskQueue,
    ];
  }
} 