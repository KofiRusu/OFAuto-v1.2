import {
  PlatformAdapter,
  PlatformType,
  PlatformAdapterConfig,
  TaskPayload,
  ExecutionResult,
  TaskType,
} from "./types";

export abstract class BasePlatformAdapter implements PlatformAdapter {
  public abstract readonly platformType: PlatformType;
  protected config: PlatformAdapterConfig | null = null;
  protected initialized = false;

  public async initialize(config: PlatformAdapterConfig): Promise<boolean> {
    try {
      const isValid = await this.validateCredentials(config.credentials);
      if (!isValid) {
        console.error(`Invalid credentials for ${this.platformType} adapter`);
        return false;
      }

      this.config = config;
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(`Error initializing ${this.platformType} adapter:`, error);
      return false;
    }
  }

  public abstract postContent(task: TaskPayload): Promise<ExecutionResult>;
  public abstract sendDM(task: TaskPayload): Promise<ExecutionResult>;
  public abstract adjustPricing(task: TaskPayload): Promise<ExecutionResult>;
  public abstract schedulePost(task: TaskPayload): Promise<ExecutionResult>;
  public abstract fetchMetrics(task: TaskPayload): Promise<ExecutionResult>;
  public abstract validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  public abstract getCredentialRequirements(): string[];

  public isInitialized(): boolean {
    return this.initialized;
  }

  protected createSuccessResult(
    taskType: TaskType,
    entityId?: string,
    metadata?: Record<string, any>
  ): ExecutionResult {
    return {
      success: true,
      platformType: this.platformType,
      taskType,
      entityId,
      metadata,
      timestamp: new Date(),
    };
  }

  protected createErrorResult(
    taskType: TaskType,
    error: string,
    metadata?: Record<string, any>
  ): ExecutionResult {
    return {
      success: false,
      platformType: this.platformType,
      taskType,
      error,
      metadata,
      timestamp: new Date(),
    };
  }

  protected checkInitialized(taskType: TaskType): ExecutionResult | null {
    if (!this.initialized || !this.config) {
      return {
        success: false,
        platformType: this.platformType,
        taskType,
        error: `${this.platformType} adapter is not initialized`,
        timestamp: new Date(),
      };
    }
    return null;
  }

  protected validateTaskPayload(
    task: TaskPayload,
    taskType: TaskType,
    requiredFields: string[]
  ): ExecutionResult | null {
    if (task.taskType !== taskType) {
      return {
        success: false,
        platformType: this.platformType,
        taskType,
        error: `Task type mismatch. Expected: ${taskType}, Got: ${task.taskType}`,
        timestamp: new Date(),
      };
    }

    const missingFields = requiredFields.filter((field) => {
      // Handle nested fields with dot notation
      if (field.includes(".")) {
        const parts = field.split(".");
        let current: any = task;
        
        for (const part of parts) {
          if (current === undefined || current === null) {
            return true;
          }
          current = current[part];
        }
        
        return current === undefined || current === null;
      }
      
      return !task[field as keyof TaskPayload];
    });

    if (missingFields.length > 0) {
      return {
        success: false,
        platformType: this.platformType,
        taskType,
        error: `Missing required fields: ${missingFields.join(", ")}`,
        timestamp: new Date(),
      };
    }

    return null;
  }
} 