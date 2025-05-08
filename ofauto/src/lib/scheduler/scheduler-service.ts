import { prisma } from "@/lib/prisma";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { TaskPayload, ExecutionResult } from "@/lib/execution-agent/types";
import { EventEmitter } from "events";

// Status enum for scheduled tasks
export enum ScheduledTaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * Service for scheduling and executing automated tasks across platforms
 */
export class SchedulerService extends EventEmitter {
  private static instance: SchedulerService;
  private polling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private executionPromises: Map<string, Promise<void>> = new Map();
  private readonly DEFAULT_POLL_INTERVAL = 60000; // 1 minute in ms
  private readonly MAX_CONCURRENT_EXECUTIONS = 5;

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance of the SchedulerService
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start the scheduler polling for tasks
   * @param interval Optional polling interval in milliseconds (default: 60000)
   */
  public startPolling(interval: number = this.DEFAULT_POLL_INTERVAL): void {
    if (this.polling) {
      console.log("Scheduler is already polling");
      return;
    }

    console.log(`Starting scheduler polling with interval of ${interval}ms`);
    
    this.polling = true;
    
    // Execute immediately on start
    this.pollScheduledTasks();
    
    // Then set up interval
    this.pollingInterval = setInterval(() => {
      this.pollScheduledTasks();
    }, interval);
    
    this.emit("polling:started", { interval });
  }

  /**
   * Stop the scheduler polling
   */
  public stopPolling(): void {
    if (!this.polling) {
      console.log("Scheduler is not currently polling");
      return;
    }

    console.log("Stopping scheduler polling");
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.polling = false;
    this.emit("polling:stopped");
  }

  /**
   * Check if the scheduler is currently polling
   */
  public isPolling(): boolean {
    return this.polling;
  }

  /**
   * Get the current execution count (number of tasks being executed)
   */
  public getCurrentExecutionCount(): number {
    return this.executionPromises.size;
  }

  /**
   * Poll for scheduled tasks that need to be executed
   */
  private async pollScheduledTasks(): Promise<void> {
    try {
      console.log("Polling for scheduled tasks...");
      
      // Skip if we've hit max concurrent executions
      if (this.executionPromises.size >= this.MAX_CONCURRENT_EXECUTIONS) {
        console.log(`Reached max concurrent executions (${this.MAX_CONCURRENT_EXECUTIONS}), skipping poll`);
        return;
      }

      // Get the current time
      const now = new Date();
      
      // Find eligible tasks - those that:
      // 1. Are scheduled for now or in the past
      // 2. Are in PENDING status
      // 3. Limit to max concurrent executions
      const eligibleTasks = await prisma.scheduledTask.findMany({
        where: {
          scheduledAt: {
            lte: now,
          },
          status: ScheduledTaskStatus.PENDING,
        },
        orderBy: {
          scheduledAt: "asc", // Process oldest first
        },
        take: this.MAX_CONCURRENT_EXECUTIONS - this.executionPromises.size,
      });

      if (eligibleTasks.length === 0) {
        console.log("No eligible tasks found");
        return;
      }

      console.log(`Found ${eligibleTasks.length} eligible tasks`);

      // Process each eligible task
      for (const task of eligibleTasks) {
        // Check if we're already executing this task
        if (this.executionPromises.has(task.id)) {
          console.log(`Task ${task.id} is already being executed, skipping`);
          continue;
        }

        // Execute the task asynchronously
        const executionPromise = this.executeTask(task.id)
          .catch(error => {
            console.error(`Error executing task ${task.id}:`, error);
          })
          .finally(() => {
            // Remove from the execution map when done
            this.executionPromises.delete(task.id);
          });

        // Add to the map of executing promises
        this.executionPromises.set(task.id, executionPromise);
      }

      // Emit event with task info
      this.emit("tasks:polled", { 
        count: eligibleTasks.length,
        tasks: eligibleTasks.map(t => t.id)
      });
      
    } catch (error) {
      console.error("Error polling scheduled tasks:", error);
      this.emit("polling:error", error);
    }
  }

  /**
   * Execute a scheduled task
   * @param taskId The ID of the task to execute
   */
  private async executeTask(taskId: string): Promise<void> {
    console.log(`Executing task ${taskId}`);
    this.emit("task:executing", { taskId });

    try {
      // Get the task
      const task = await prisma.scheduledTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        console.error(`Task ${taskId} not found`);
        return;
      }

      // Check if task is still eligible (status might have changed)
      if (task.status !== ScheduledTaskStatus.PENDING) {
        console.log(`Task ${taskId} is no longer pending (status: ${task.status}), skipping`);
        return;
      }

      // Check execution window
      const now = new Date();
      const windowEnd = new Date(task.scheduledAt);
      windowEnd.setSeconds(windowEnd.getSeconds() + task.executionWindow);
      
      if (now > windowEnd) {
        await prisma.scheduledTask.update({
          where: { id: taskId },
          data: {
            status: ScheduledTaskStatus.FAILED,
            errorMessage: `Execution window expired. Task was scheduled for ${task.scheduledAt.toISOString()} with a window of ${task.executionWindow} seconds`,
            executedAt: now,
          },
        });
        
        this.emit("task:window-expired", { taskId, scheduledAt: task.scheduledAt });
        return;
      }

      // Mark task as in progress
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          status: ScheduledTaskStatus.IN_PROGRESS,
          updatedAt: now,
        },
      });

      // Convert the payload to TaskPayload
      const executionPayload = task.payload as unknown as TaskPayload;
      
      // Add platform and client IDs from the task
      executionPayload.platformId = task.platformId;
      executionPayload.clientId = task.clientId;

      // Get the execution service
      const executionService = getExecutionService();

      // Execute the task
      const result = await executionService.executeTask(executionPayload);
      
      // Update the task with the result
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          status: result.success ? ScheduledTaskStatus.COMPLETED : ScheduledTaskStatus.FAILED,
          resultLog: result as any,
          errorMessage: result.success ? null : result.error,
          executedAt: now,
          updatedAt: now,
        },
      });

      console.log(`Task ${taskId} executed ${result.success ? "successfully" : "with failure"}`);
      this.emit("task:executed", {
        taskId,
        success: result.success,
        result,
      });
      
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      
      // Update the task with the error
      try {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Get current retry count
        const task = await prisma.scheduledTask.findUnique({
          where: { id: taskId },
          select: { retryCount: true, maxRetries: true },
        });
        
        if (!task) {
          console.error(`Task ${taskId} not found during error handling`);
          return;
        }
        
        const newRetryCount = task.retryCount + 1;
        const maxRetriesReached = newRetryCount >= task.maxRetries;
        
        await prisma.scheduledTask.update({
          where: { id: taskId },
          data: {
            status: maxRetriesReached ? ScheduledTaskStatus.FAILED : ScheduledTaskStatus.PENDING,
            errorMessage,
            retryCount: newRetryCount,
            lastRetryAt: new Date(),
            executedAt: maxRetriesReached ? new Date() : null,
          },
        });
        
        this.emit("task:error", {
          taskId,
          error: errorMessage,
          retryCount: newRetryCount,
          maxRetries: task.maxRetries,
          willRetry: !maxRetriesReached,
        });
        
      } catch (updateError) {
        console.error(`Error updating task ${taskId} after execution error:`, updateError);
      }
    }
  }

  /**
   * Schedule a new task
   * @param taskData The task data to schedule
   */
  public async scheduleTask(taskData: {
    clientId: string;
    platformId: string;
    taskType: string;
    payload: Record<string, any>;
    scheduledAt: Date;
    executionWindow?: number;
    maxRetries?: number;
  }): Promise<string> {
    // Validate that the scheduled time is in the future
    const now = new Date();
    if (taskData.scheduledAt <= now) {
      throw new Error("Scheduled time must be in the future");
    }

    // Create the task
    const task = await prisma.scheduledTask.create({
      data: {
        clientId: taskData.clientId,
        platformId: taskData.platformId,
        taskType: taskData.taskType,
        payload: taskData.payload as any,
        scheduledAt: taskData.scheduledAt,
        executionWindow: taskData.executionWindow || 300, // Default 5 minutes
        maxRetries: taskData.maxRetries || 3, // Default 3 retries
        status: ScheduledTaskStatus.PENDING,
      },
    });

    console.log(`Scheduled new task ${task.id} for ${taskData.scheduledAt.toISOString()}`);
    this.emit("task:scheduled", {
      taskId: task.id,
      scheduledAt: taskData.scheduledAt,
      taskType: taskData.taskType,
    });

    return task.id;
  }

  /**
   * Cancel a scheduled task
   * @param taskId The ID of the task to cancel
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    try {
      // Get the task
      const task = await prisma.scheduledTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Check if task can be cancelled
      if (task.status !== ScheduledTaskStatus.PENDING) {
        throw new Error(`Task ${taskId} cannot be cancelled because it is already ${task.status}`);
      }

      // Update the task status
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          status: ScheduledTaskStatus.CANCELLED,
          updatedAt: new Date(),
        },
      });

      console.log(`Cancelled task ${taskId}`);
      this.emit("task:cancelled", { taskId });
      
      return true;
    } catch (error) {
      console.error(`Error cancelling task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Reschedule a task
   * @param taskId The ID of the task to reschedule
   * @param newScheduledAt The new scheduled time
   */
  public async rescheduleTask(taskId: string, newScheduledAt: Date): Promise<boolean> {
    try {
      // Validate that the new scheduled time is in the future
      const now = new Date();
      if (newScheduledAt <= now) {
        throw new Error("New scheduled time must be in the future");
      }

      // Get the task
      const task = await prisma.scheduledTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Check if task can be rescheduled
      if (
        task.status !== ScheduledTaskStatus.PENDING &&
        task.status !== ScheduledTaskStatus.FAILED
      ) {
        throw new Error(`Task ${taskId} cannot be rescheduled because it is ${task.status}`);
      }

      // Update the task
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          scheduledAt: newScheduledAt,
          status: ScheduledTaskStatus.PENDING,
          updatedAt: now,
          retryCount: 0,
          errorMessage: null,
        },
      });

      console.log(`Rescheduled task ${taskId} to ${newScheduledAt.toISOString()}`);
      this.emit("task:rescheduled", {
        taskId,
        oldScheduledAt: task.scheduledAt,
        newScheduledAt,
      });
      
      return true;
    } catch (error) {
      console.error(`Error rescheduling task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduled tasks for a client
   * @param clientId The client ID
   * @param status Optional status filter
   * @param limit Optional limit (default: 50)
   * @param offset Optional offset (default: 0)
   */
  public async getScheduledTasks(
    clientId: string,
    status?: ScheduledTaskStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const where: any = { clientId };
    
    if (status) {
      where.status = status;
    }

    const tasks = await prisma.scheduledTask.findMany({
      where,
      orderBy: {
        scheduledAt: "desc",
      },
      take: limit,
      skip: offset,
      include: {
        platform: {
          select: {
            platformType: true,
            name: true,
          }
        }
      }
    });

    return tasks;
  }
} 