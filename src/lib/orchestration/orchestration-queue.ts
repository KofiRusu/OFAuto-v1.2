import { ExecutionTask, TaskPriority, ExecutionResult } from './OrchestrationEngine';

interface QueuedTask {
  task: ExecutionTask;
  addedAt: Date;
}

export class OrchestrationQueue {
  private queue: QueuedTask[] = [];
  private processing: boolean = false;
  private taskProcessors: Map<string, (task: ExecutionTask) => Promise<ExecutionResult>> = new Map();
  private completedTasks: Map<string, ExecutionResult> = new Map();
  
  /**
   * Register a task processor for a specific action type
   */
  registerTaskProcessor(
    actionType: string, 
    processor: (task: ExecutionTask) => Promise<ExecutionResult>
  ): void {
    this.taskProcessors.set(actionType, processor);
  }
  
  /**
   * Add a task to the queue
   */
  async addTask(task: ExecutionTask): Promise<void> {
    // Add task to queue
    this.queue.push({
      task,
      addedAt: new Date(),
    });
    
    // Sort queue by priority and scheduled time
    this.sortQueue();
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  /**
   * Add multiple tasks to the queue
   */
  async addTasks(tasks: ExecutionTask[]): Promise<void> {
    for (const task of tasks) {
      this.queue.push({
        task,
        addedAt: new Date(),
      });
    }
    
    // Sort queue by priority and scheduled time
    this.sortQueue();
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  /**
   * Sort the queue by priority and scheduled time
   */
  private sortQueue(): void {
    const priorityValues: Record<TaskPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    
    this.queue.sort((a, b) => {
      // First sort by priority (high > medium > low)
      const priorityDiff = priorityValues[b.task.priority] - priorityValues[a.task.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Then sort by scheduled time (earlier first)
      const aTime = a.task.scheduledTime || a.addedAt;
      const bTime = b.task.scheduledTime || b.addedAt;
      return aTime.getTime() - bTime.getTime();
    });
  }
  
  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    
    const now = new Date();
    const { task } = this.queue[0];
    
    // Check if task is ready to execute
    if (task.scheduledTime && task.scheduledTime > now) {
      // Task is scheduled for the future
      const delayMs = task.scheduledTime.getTime() - now.getTime();
      setTimeout(() => this.processQueue(), delayMs);
      return;
    }
    
    // Check if dependencies are satisfied
    if (task.dependencies.length > 0) {
      const allDependenciesSatisfied = task.dependencies.every(depId => 
        this.completedTasks.has(depId) && this.completedTasks.get(depId)!.success
      );
      
      if (!allDependenciesSatisfied) {
        // Move this task to the end of the queue
        this.queue.shift();
        this.queue.push({
          task,
          addedAt: new Date() // Reset the added time to avoid priority issues
        });
        this.sortQueue();
        
        // Process next task
        setTimeout(() => this.processQueue(), 100);
        return;
      }
    }
    
    // Get the task processor
    const processor = this.taskProcessors.get(task.actionType);
    if (!processor) {
      console.error(`No processor registered for action type: ${task.actionType}`);
      
      // Mark as failed
      this.completedTasks.set(task.id, {
        taskId: task.id,
        success: false,
        error: `No processor registered for action type: ${task.actionType}`
      });
      
      // Remove from queue
      this.queue.shift();
      
      // Process next task
      setTimeout(() => this.processQueue(), 0);
      return;
    }
    
    try {
      // Process the task
      const startTime = Date.now();
      const result = await processor(task);
      const executionTime = Date.now() - startTime;
      
      // Store the result
      this.completedTasks.set(task.id, {
        ...result,
        executionTime
      });
      
      // If task failed and retries are available, re-queue with delay
      if (!result.success && task.retryCount < task.maxRetries) {
        // Increment retry count
        task.retryCount++;
        
        // Calculate delay using exponential backoff
        const delayMs = Math.pow(2, task.retryCount) * 1000; // 2, 4, 8, ... seconds
        
        // Schedule for retry
        task.scheduledTime = new Date(Date.now() + delayMs);
        
        // Re-queue the task
        this.queue.push({
          task,
          addedAt: new Date()
        });
      }
    } catch (error) {
      // Handle error
      console.error(`Error processing task ${task.id}:`, error);
      
      // Store the result
      this.completedTasks.set(task.id, {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // If retries are available, re-queue with delay
      if (task.retryCount < task.maxRetries) {
        // Increment retry count
        task.retryCount++;
        
        // Calculate delay using exponential backoff
        const delayMs = Math.pow(2, task.retryCount) * 1000; // 2, 4, 8, ... seconds
        
        // Schedule for retry
        task.scheduledTime = new Date(Date.now() + delayMs);
        
        // Re-queue the task
        this.queue.push({
          task,
          addedAt: new Date()
        });
      }
    } finally {
      // Remove task from queue
      this.queue.shift();
      
      // Sort the queue
      this.sortQueue();
      
      // Process next task
      setTimeout(() => this.processQueue(), 0);
    }
  }
  
  /**
   * Get all tasks in the queue
   */
  getQueuedTasks(): ExecutionTask[] {
    return this.queue.map(q => q.task);
  }
  
  /**
   * Get a completed task result
   */
  getTaskResult(taskId: string): ExecutionResult | undefined {
    return this.completedTasks.get(taskId);
  }
  
  /**
   * Get the current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
  
  /**
   * Cancel a task in the queue
   */
  cancelTask(taskId: string): boolean {
    const index = this.queue.findIndex(q => q.task.id === taskId);
    if (index === -1) {
      return false;
    }
    
    // Mark the task as cancelled
    this.queue[index].task.status = 'cancelled';
    
    // Remove from queue
    this.queue.splice(index, 1);
    
    return true;
  }
  
  /**
   * Retry a completed task
   */
  retryTask(taskId: string): boolean {
    // Check if task exists in completed tasks
    if (!this.completedTasks.has(taskId)) {
      return false;
    }
    
    // Get the task result
    const result = this.completedTasks.get(taskId)!;
    
    // Check if task failed
    if (result.success) {
      return false; // Can't retry a successful task
    }
    
    // Find the original task in the completed tasks
    const originalTask = Array.from(this.completedTasks.entries())
      .find(([id, res]) => id === taskId)?.[0];
    
    if (!originalTask) {
      return false;
    }
    
    // Create a new task with the same parameters
    const task: ExecutionTask = {
      ...JSON.parse(JSON.stringify(originalTask)), // Deep clone
      id: `retry-${taskId}-${Date.now()}`,
      status: 'queued',
      retryCount: 0,
      startTime: undefined,
      endTime: undefined,
      result: undefined,
      error: undefined
    };
    
    // Add to queue
    this.addTask(task);
    
    return true;
  }
} 