// Types
export type Platform = 'onlyfans' | 'fansly' | 'instagram' | 'twitter' | 'patreon' | 'kofi';
export type ActionType = 'post' | 'message' | 'pricing' | 'follow' | 'analyze';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Strategy {
  id: string;
  name: string;
  type: string;
  platforms: Platform[];
  actions: StrategyAction[];
  metadata?: Record<string, any>;
}

export interface StrategyAction {
  type: ActionType;
  platform: Platform;
  params: Record<string, any>;
  schedule?: Date;
  dependencies?: string[]; // IDs of other actions that must complete first
}

export interface ManualTrigger {
  type: ActionType;
  platform: Platform;
  params: Record<string, any>;
  priority?: TaskPriority;
  scheduledTime?: Date;
}

export interface ExecutionTask {
  id: string;
  triggerType: 'strategy' | 'manual';
  triggerId: string; // ID of the strategy or manual trigger
  actionType: ActionType;
  platform: Platform;
  params: Record<string, any>;
  priority: TaskPriority;
  status: TaskStatus;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: any;
  retryCount: number;
  maxRetries: number;
  dependencies: string[]; // IDs of other tasks that must complete first
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: any;
  executionTime?: number;
}

// Mock services that would be implemented in a real application
export interface ExecutionAgent {
  executeTask(task: ExecutionTask): Promise<ExecutionResult>;
}

export interface ExecutionLogger {
  logTaskCreation(task: ExecutionTask): Promise<void>;
  logTaskUpdate(taskId: string, updates: Partial<ExecutionTask>): Promise<void>;
  logTaskResult(result: ExecutionResult): Promise<void>;
}

export class OrchestrationEngine {
  private executionAgent: ExecutionAgent;
  private executionLogger: ExecutionLogger;
  
  constructor(executionAgent: ExecutionAgent, executionLogger: ExecutionLogger) {
    this.executionAgent = executionAgent;
    this.executionLogger = executionLogger;
  }
  
  /**
   * Handle a strategy by converting it into execution tasks
   */
  async handleStrategy(strategy: Strategy): Promise<string[]> {
    const tasks: ExecutionTask[] = [];
    const taskIds: string[] = [];
    
    // Create execution tasks for each action in the strategy
    for (const action of strategy.actions) {
      const taskId = this.generateTaskId();
      taskIds.push(taskId);
      
      const task: ExecutionTask = {
        id: taskId,
        triggerType: 'strategy',
        triggerId: strategy.id,
        actionType: action.type,
        platform: action.platform,
        params: action.params,
        priority: 'medium', // Default priority
        status: 'queued',
        scheduledTime: action.schedule,
        retryCount: 0,
        maxRetries: 3,
        dependencies: action.dependencies || []
      };
      
      tasks.push(task);
      await this.executionLogger.logTaskCreation(task);
    }
    
    // Add tasks to the queue
    await this.queueTasks(tasks);
    
    return taskIds;
  }
  
  /**
   * Handle a manual trigger by converting it into an execution task
   */
  async handleManualTrigger(trigger: ManualTrigger): Promise<string> {
    const taskId = this.generateTaskId();
    
    const task: ExecutionTask = {
      id: taskId,
      triggerType: 'manual',
      triggerId: 'manual-' + Date.now(),
      actionType: trigger.type,
      platform: trigger.platform,
      params: trigger.params,
      priority: trigger.priority || 'high', // Manual triggers are high priority by default
      status: 'queued',
      scheduledTime: trigger.scheduledTime,
      retryCount: 0,
      maxRetries: 3,
      dependencies: []
    };
    
    await this.executionLogger.logTaskCreation(task);
    await this.queueTasks([task]);
    
    return taskId;
  }
  
  /**
   * Queue tasks for execution
   */
  private async queueTasks(tasks: ExecutionTask[]): Promise<void> {
    // In a real implementation, this would add tasks to a queue service
    // For simplicity, we'll just execute them immediately
    for (const task of tasks) {
      // Check if dependencies are satisfied
      if (task.dependencies.length > 0) {
        // In a real implementation, this would check if dependencies are completed
        console.log(`Task ${task.id} has dependencies and will be queued`);
        continue;
      }
      
      // If no dependencies or all dependencies are satisfied, execute the task
      if (!task.scheduledTime || task.scheduledTime <= new Date()) {
        await this.executeTask(task);
      } else {
        console.log(`Task ${task.id} scheduled for later execution at ${task.scheduledTime}`);
        // In a real implementation, this would schedule the task for later execution
      }
    }
  }
  
  /**
   * Execute a task
   */
  private async executeTask(task: ExecutionTask): Promise<void> {
    try {
      // Update task status
      task.status = 'running';
      task.startTime = new Date();
      await this.executionLogger.logTaskUpdate(task.id, {
        status: task.status,
        startTime: task.startTime
      });
      
      // Execute task
      const result = await this.executionAgent.executeTask(task);
      
      // Update task status
      task.status = result.success ? 'completed' : 'failed';
      task.endTime = new Date();
      task.result = result.data;
      task.error = result.error;
      
      await this.executionLogger.logTaskUpdate(task.id, {
        status: task.status,
        endTime: task.endTime,
        result: task.result,
        error: task.error
      });
      
      await this.executionLogger.logTaskResult(result);
      
      // If task failed, handle retry logic
      if (!result.success && task.retryCount < task.maxRetries) {
        await this.retryTask(task);
      }
    } catch (error) {
      // Handle execution errors
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error;
      
      await this.executionLogger.logTaskUpdate(task.id, {
        status: task.status,
        endTime: task.endTime,
        error: task.error
      });
      
      // Handle retry logic
      if (task.retryCount < task.maxRetries) {
        await this.retryTask(task);
      }
    }
  }
  
  /**
   * Retry a failed task
   */
  private async retryTask(task: ExecutionTask): Promise<void> {
    // Increment retry count
    task.retryCount++;
    
    // Calculate exponential backoff delay
    const delayMs = Math.pow(2, task.retryCount) * 1000; // 2, 4, 8, ... seconds
    
    console.log(`Scheduling retry for task ${task.id} in ${delayMs}ms (retry ${task.retryCount}/${task.maxRetries})`);
    
    // In a real implementation, this would schedule a retry after the delay
    setTimeout(async () => {
      task.status = 'queued';
      await this.executeTask(task);
    }, delayMs);
  }
  
  /**
   * Generate a unique task ID
   */
  private generateTaskId(): string {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
} 