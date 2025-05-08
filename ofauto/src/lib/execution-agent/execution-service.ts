import { prisma } from "@/lib/prisma";
import { getStrategyService } from "../ai-strategy";
import {
  ExecutionAgentService,
  PlatformAdapter,
  PlatformType,
  TaskPayload,
  ExecutionResult,
  ExecutionTask,
  TaskType,
} from "./types";
import { v4 as uuidv4 } from "uuid";

class ExecutionAgentServiceImpl implements ExecutionAgentService {
  private static instance: ExecutionAgentServiceImpl;
  private platformAdapters: Map<PlatformType, PlatformAdapter> = new Map();

  private constructor() {}

  public static getInstance(): ExecutionAgentServiceImpl {
    if (!ExecutionAgentServiceImpl.instance) {
      ExecutionAgentServiceImpl.instance = new ExecutionAgentServiceImpl();
    }
    return ExecutionAgentServiceImpl.instance;
  }

  public registerPlatformAdapter(adapter: PlatformAdapter): void {
    this.platformAdapters.set(adapter.platformType, adapter);
    console.log(`Registered ${adapter.platformType} adapter`);
  }

  public getPlatformAdapter(platformType: PlatformType): PlatformAdapter | null {
    return this.platformAdapters.get(platformType) || null;
  }

  public async executeTask(task: TaskPayload): Promise<ExecutionResult> {
    // Get platform type from platformId
    const platform = await prisma.platform.findUnique({
      where: { id: task.platformId },
    });

    if (!platform) {
      return this.createErrorResult(
        task.taskType,
        "UNKNOWN",
        `Platform with ID ${task.platformId} not found`
      );
    }

    const platformType = platform.platformType.toUpperCase() as PlatformType;
    const adapter = this.getPlatformAdapter(platformType);

    if (!adapter) {
      return this.createErrorResult(
        task.taskType,
        platformType,
        `No adapter registered for platform type ${platformType}`
      );
    }

    // Create task record in database
    const taskId = uuidv4();
    await prisma.executionTask.create({
      data: {
        id: taskId,
        clientId: task.clientId,
        platformId: task.platformId,
        taskType: task.taskType,
        strategyId: task.strategyId,
        recommendationId: task.recommendationId,
        status: "PENDING",
        payload: task as any,
      },
    });

    try {
      // Update task status
      await prisma.executionTask.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });

      // Execute the task through the appropriate adapter method
      let result: ExecutionResult;
      switch (task.taskType) {
        case "POST_CONTENT":
          result = await adapter.postContent(task);
          break;
        case "SEND_DM":
          result = await adapter.sendDM(task);
          break;
        case "ADJUST_PRICING":
          result = await adapter.adjustPricing(task);
          break;
        case "SCHEDULE_POST":
          result = await adapter.schedulePost(task);
          break;
        case "FETCH_METRICS":
          result = await adapter.fetchMetrics(task);
          break;
        default:
          result = this.createErrorResult(
            task.taskType as TaskType,
            platformType,
            `Unsupported task type: ${task.taskType}`
          );
      }

      // Update task with result
      await prisma.executionTask.update({
        where: { id: taskId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          result: result as any,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      const errorResult = this.createErrorResult(
        task.taskType as TaskType,
        platformType,
        error instanceof Error ? error.message : "Unknown error"
      );

      // Update task with error result
      await prisma.executionTask.update({
        where: { id: taskId },
        data: {
          status: "FAILED",
          result: errorResult as any,
          completedAt: new Date(),
        },
      });

      return errorResult;
    }
  }

  public async executeStrategyRecommendation(
    strategyId: string,
    recommendationId: string
  ): Promise<ExecutionResult[]> {
    const strategyService = getStrategyService();
    const strategy = await strategyService.getStrategy(strategyId);

    if (!strategy) {
      return [
        this.createErrorResult(
          "POST_CONTENT", // Placeholder
          "UNKNOWN",
          `Strategy with ID ${strategyId} not found`
        ),
      ];
    }

    // Find the recommendation
    const recommendation = strategy.recommendations.find(
      (rec) => rec.id === recommendationId
    );

    if (!recommendation) {
      return [
        this.createErrorResult(
          "POST_CONTENT", // Placeholder
          "UNKNOWN",
          `Recommendation with ID ${recommendationId} not found`
        ),
      ];
    }

    // Get client's platforms
    const clientPlatforms = await prisma.platform.findMany({
      where: { clientId: strategy.clientId },
    });

    if (clientPlatforms.length === 0) {
      return [
        this.createErrorResult(
          "POST_CONTENT", // Placeholder
          "UNKNOWN",
          `No platforms found for client ${strategy.clientId}`
        ),
      ];
    }

    // Determine tasks based on recommendation
    const tasks: TaskPayload[] = this.createTasksFromRecommendation(
      strategy.clientId,
      strategyId,
      recommendationId,
      recommendation,
      clientPlatforms
    );

    // Execute all tasks
    const results = await Promise.all(
      tasks.map((task) => this.executeTask(task))
    );

    return results;
  }

  public async getTaskHistory(
    clientId: string,
    platformId?: string,
    taskType?: TaskType
  ): Promise<ExecutionTask[]> {
    const where: any = { clientId };

    if (platformId) {
      where.platformId = platformId;
    }

    if (taskType) {
      where.taskType = taskType;
    }

    const tasks = await prisma.executionTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return tasks as ExecutionTask[];
  }

  private createErrorResult(
    taskType: TaskType,
    platformType: PlatformType | string,
    errorMessage: string
  ): ExecutionResult {
    return {
      success: false,
      platformType: platformType as PlatformType,
      taskType,
      error: errorMessage,
      timestamp: new Date(),
    };
  }

  private createTasksFromRecommendation(
    clientId: string,
    strategyId: string,
    recommendationId: string,
    recommendation: any,
    platforms: any[]
  ): TaskPayload[] {
    const tasks: TaskPayload[] = [];

    // Logic to parse recommendation and create appropriate tasks
    // This will vary based on recommendation type, but here's a simplified example:
    
    if (recommendation.category === "CONTENT") {
      // For content recommendations, create post tasks for each platform
      platforms.forEach((platform) => {
        tasks.push({
          clientId,
          platformId: platform.id,
          strategyId,
          recommendationId,
          taskType: "POST_CONTENT",
          content: recommendation.description || recommendation.title,
          // Other recommendation-specific fields would be added here
        });
      });
    } else if (recommendation.category === "PRICING") {
      // For pricing recommendations, create pricing adjustment tasks
      const mainPlatform = platforms.find(p => p.platformType === "ONLYFANS") || platforms[0];
      
      tasks.push({
        clientId,
        platformId: mainPlatform.id,
        strategyId,
        recommendationId,
        taskType: "ADJUST_PRICING",
        pricingData: {
          // Extract pricing details from recommendation
          newPrice: recommendation.price || recommendation.suggestedPrice
        },
      });
    } else if (recommendation.category === "ENGAGEMENT") {
      // For engagement recommendations, create DM tasks
      platforms.forEach((platform) => {
        tasks.push({
          clientId,
          platformId: platform.id,
          strategyId,
          recommendationId,
          taskType: "SEND_DM",
          content: recommendation.messageTemplate || recommendation.description,
        });
      });
    }

    // If no specific tasks were created, create a generic one
    if (tasks.length === 0) {
      const defaultPlatform = platforms[0];
      tasks.push({
        clientId,
        platformId: defaultPlatform.id,
        strategyId,
        recommendationId,
        taskType: "POST_CONTENT",
        content: recommendation.description || recommendation.title,
      });
    }

    return tasks;
  }
}

export const getExecutionService = (): ExecutionAgentService => {
  return ExecutionAgentServiceImpl.getInstance();
}; 