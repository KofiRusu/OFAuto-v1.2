import { prisma } from '../db';
import { logger } from '../logger';
import { OrchestrationEngine, ManualTrigger, ExecutionTask } from './OrchestrationEngine';

/** Available trigger types for orchestration */
export enum TriggerType {
  SUBSCRIPTION_DIP = 'SUBSCRIPTION_DIP',
  ROI_THRESHOLD = 'ROI_THRESHOLD',
  CAMPAIGN_UNDERPERFORMANCE = 'CAMPAIGN_UNDERPERFORMANCE',
  CONTENT_PERFORMANCE = 'CONTENT_PERFORMANCE',
  EXPERIMENT_CONCLUSION = 'EXPERIMENT_CONCLUSION',
}

export interface AutomationTrigger {
  id: string;
  clientId: string;
  type: TriggerType;
  conditions: Record<string, any>;
  actions: ManualTrigger[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TriggerEngine {
  private orchestrationEngine: OrchestrationEngine;
  
  constructor() {
    // Mock implementations for testing
    const mockExecutionAgent = {
      executeTask: async (task: any) => ({ taskId: task.id, success: true, data: {} })
    };
    
    const mockExecutionLogger = {
      logTaskCreation: async (task: any) => {},
      logTaskUpdate: async (taskId: string, updates: any) => {},
      logTaskResult: async (result: any) => {}
    };
    
    this.orchestrationEngine = new OrchestrationEngine(mockExecutionAgent, mockExecutionLogger);
  }
  
  /**
   * Monitor client metrics and trigger automated actions when conditions are met
   */
  async monitorAllClients(): Promise<void> {
    try {
      logger.info('Starting trigger monitoring for all clients');
      
      // Get all active clients
      const clients = await prisma.client.findMany({
        select: { id: true, name: true }
      });
      
      // Process each client
      for (const client of clients) {
        await this.processClient(client.id);
      }
      
      logger.info('Completed trigger monitoring cycle');
    } catch (error) {
      logger.error({ error }, 'Error in monitor all clients process');
    }
  }
  
  /**
   * Process triggers for a specific client
   */
  async processClient(clientId: string): Promise<void> {
    try {
      logger.info({ clientId }, 'Processing triggers for client');
      
      // Get all active triggers for this client
      const activeTriggers = await this.getActiveTriggers(clientId);
      
      // Check each trigger
      for (const trigger of activeTriggers) {
        await this.evaluateTrigger(trigger);
      }
    } catch (error) {
      logger.error({ error, clientId }, 'Error processing client triggers');
    }
  }
  
  /**
   * Get all active automation triggers for a client
   */
  private async getActiveTriggers(clientId: string): Promise<AutomationTrigger[]> {
    try {
      // In future implementation, this will fetch from the database
      // For now, we'll use hardcoded triggers for proof of concept
      return [
        {
          id: `subscription-dip-${clientId}`,
          clientId,
          type: TriggerType.SUBSCRIPTION_DIP,
          conditions: {
            threshold: 0.05, // 5% decrease
            timeFrame: 'day'  // 'day', 'week', 'month'
          },
          actions: [
            {
              type: 'message',
              platform: 'onlyfans',
              params: {
                message: 'Special discount for all subscribers! Use code WELCOME20 for 20% off your next renewal.',
                audience: 'all_subscribers'
              },
              priority: 'high'
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `roi-threshold-${clientId}`,
          clientId,
          type: TriggerType.ROI_THRESHOLD,
          conditions: {
            threshold: 2.0, // ROI of 2.0 (200%)
            timeFrame: 'week' // 'day', 'week', 'month'
          },
          actions: [
            {
              type: 'post',
              platform: 'onlyfans',
              params: {
                message: 'Thanks to all my subscribers for making this content possible! To celebrate, I\'m releasing exclusive bonus content this weekend!',
              },
              priority: 'medium'
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `campaign-underperformance-${clientId}`,
          clientId,
          type: TriggerType.CAMPAIGN_UNDERPERFORMANCE,
          conditions: {
            threshold: 0.3, // 30% below expected
            timeFrame: 'week' // 'day', 'week', 'month'
          },
          actions: [
            {
              type: 'pricing',
              platform: 'onlyfans',
              params: {
                action: 'discount',
                percentage: 25,
                duration: 3 // days
              },
              priority: 'high'
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      logger.error({ error, clientId }, 'Error getting active triggers');
      return [];
    }
  }
  
  /**
   * Evaluate if a trigger's conditions are met
   */
  private async evaluateTrigger(trigger: AutomationTrigger): Promise<void> {
    try {
      logger.debug({ triggerId: trigger.id, clientId: trigger.clientId }, 'Evaluating trigger');
      
      const conditions = trigger.conditions;
      let conditionsMet = false;
      
      // Check different trigger types
      switch (trigger.type) {
        case TriggerType.SUBSCRIPTION_DIP:
          conditionsMet = await this.checkSubscriptionDip(
            trigger.clientId, 
            conditions.threshold, 
            conditions.timeFrame
          );
          break;
          
        case TriggerType.ROI_THRESHOLD:
          conditionsMet = await this.checkROIThreshold(
            trigger.clientId, 
            conditions.threshold, 
            conditions.timeFrame
          );
          break;
          
        case TriggerType.CAMPAIGN_UNDERPERFORMANCE:
          conditionsMet = await this.checkCampaignPerformance(
            trigger.clientId, 
            conditions.threshold, 
            conditions.timeFrame
          );
          break;
          
        case TriggerType.EXPERIMENT_CONCLUSION:
          conditionsMet = await this.checkExperimentConclusion(
            trigger.clientId,
            conditions.experimentId
          );
          break;
      }
      
      // If conditions are met, execute the trigger's actions
      if (conditionsMet) {
        await this.executeTriggerActions(trigger);
      }
    } catch (error) {
      logger.error({ error, triggerId: trigger.id }, 'Error evaluating trigger');
    }
  }
  
  /**
   * Check if there has been a subscription dip
   */
  private async checkSubscriptionDip(
    clientId: string, 
    threshold: number,
    timeFrame: string
  ): Promise<boolean> {
    try {
      // Get current and previous metrics
      const currentMetrics = await prisma.financialMetric.findMany({
        where: { 
          clientId,
          type: 'subscription_revenue',
          createdAt: {
            gte: this.getTimeFrameStartDate(timeFrame)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      const previousMetrics = await prisma.financialMetric.findMany({
        where: { 
          clientId,
          type: 'subscription_revenue',
          createdAt: {
            lt: this.getTimeFrameStartDate(timeFrame),
            gte: this.getTimeFrameStartDate(this.getDoubleTimeFrame(timeFrame))
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (currentMetrics.length === 0 || previousMetrics.length === 0) {
        return false;
      }
      
      const currentValue = currentMetrics[0].value;
      const previousValue = previousMetrics[0].value;
      
      // Calculate dip percentage
      const dipPercentage = (previousValue - currentValue) / previousValue;
      
      return dipPercentage >= threshold;
    } catch (error) {
      logger.error({ error, clientId }, 'Error checking subscription dip');
      return false;
    }
  }
  
  /**
   * Check if the ROI threshold has been reached
   */
  private async checkROIThreshold(
    clientId: string, 
    threshold: number,
    timeFrame: string
  ): Promise<boolean> {
    try {
      // Get revenue and cost metrics
      const revenueMetrics = await prisma.financialMetric.findMany({
        where: { 
          clientId,
          type: 'total_revenue',
          createdAt: {
            gte: this.getTimeFrameStartDate(timeFrame)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      const costMetrics = await prisma.financialMetric.findMany({
        where: { 
          clientId,
          type: 'total_cost',
          createdAt: {
            gte: this.getTimeFrameStartDate(timeFrame)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (revenueMetrics.length === 0 || costMetrics.length === 0) {
        return false;
      }
      
      const revenue = revenueMetrics[0].value;
      const cost = costMetrics[0].value;
      
      // Calculate ROI
      const roi = revenue / cost;
      
      return roi >= threshold;
    } catch (error) {
      logger.error({ error, clientId }, 'Error checking ROI threshold');
      return false;
    }
  }
  
  /**
   * Check campaign performance against expected metrics
   */
  private async checkCampaignPerformance(
    clientId: string, 
    threshold: number,
    timeFrame: string
  ): Promise<boolean> {
    try {
      // Check active campaign experiments
      const experiments = await prisma.campaignExperiment.findMany({
        where: {
          clientId,
          status: 'running',
          startDate: {
            lte: new Date() // Started in the past
          },
          endDate: {
            gte: new Date() // Not yet ended
          }
        }
      });
      
      // No active experiments
      if (experiments.length === 0) {
        return false;
      }
      
      // For each experiment, check if any variant is underperforming
      for (const experiment of experiments) {
        const performanceData = experiment.performanceData as Record<string, Record<string, any>> || {};
        
        // Skip if no performance data yet
        if (Object.keys(performanceData).length === 0) {
          continue;
        }
        
        const controlId = experiment.controlVariantId;
        if (!controlId || !performanceData[controlId]) {
          continue;
        }
        
        // Get the expected value based on the control variant
        const controlMetric = performanceData[controlId][experiment.goalMetric] || 0;
        
        // Check each variant
        for (const variantId of Object.keys(performanceData)) {
          if (variantId === controlId) continue; // Skip control
          
          const variantMetric = performanceData[variantId][experiment.goalMetric] || 0;
          
          // Calculate performance compared to control
          const performance = variantMetric / controlMetric;
          
          // If underperforming by the threshold
          if (performance <= (1 - threshold)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.error({ error, clientId }, 'Error checking campaign performance');
      return false;
    }
  }
  
  /**
   * Check if an experiment has concluded and needs analysis
   */
  private async checkExperimentConclusion(
    clientId: string,
    experimentId: string
  ): Promise<boolean> {
    try {
      const experiment = await prisma.campaignExperiment.findFirst({
        where: {
          id: experimentId,
          clientId,
          status: 'running',
          endDate: {
            lte: new Date() // Experiment ended
          },
          conclusion: null // No conclusion yet
        }
      });
      
      return !!experiment;
    } catch (error) {
      logger.error({ error, clientId, experimentId }, 'Error checking experiment conclusion');
      return false;
    }
  }
  
  /**
   * Execute all actions for a triggered automation
   */
  private async executeTriggerActions(trigger: AutomationTrigger): Promise<void> {
    try {
      logger.info({ triggerId: trigger.id, clientId: trigger.clientId }, 'Executing trigger actions');
      
      // Update the last triggered timestamp
      trigger.lastTriggeredAt = new Date();
      
      // In future implementation, save to database
      // await prisma.automationTrigger.update({
      //   where: { id: trigger.id },
      //   data: { lastTriggeredAt: trigger.lastTriggeredAt }
      // });
      
      // Execute each action
      const taskIds: string[] = [];
      for (const action of trigger.actions) {
        const taskId = await this.orchestrationEngine.handleManualTrigger(action);
        taskIds.push(taskId);
      }
      
      // Generate AI insights for this trigger event
      await this.generateTriggerInsight(trigger);
      
      logger.info(
        { triggerId: trigger.id, clientId: trigger.clientId, taskIds }, 
        'Successfully executed trigger actions'
      );
    } catch (error) {
      logger.error({ error, triggerId: trigger.id }, 'Error executing trigger actions');
    }
  }
  
  /**
   * Generate an AI insight for a triggered automation
   */
  private async generateTriggerInsight(trigger: AutomationTrigger): Promise<void> {
    try {
      // Generate insight based on the trigger type
      switch (trigger.type) {
        case TriggerType.SUBSCRIPTION_DIP:
          await this.generateInsightForSubscriptionDip(trigger.conditions.threshold);
          break;
          
        case TriggerType.ROI_THRESHOLD:
          await this.generateInsightForPositiveROI(trigger.conditions.threshold);
          break;
          
        case TriggerType.CAMPAIGN_UNDERPERFORMANCE:
          await this.generateInsightForCampaignUnderperformance(trigger.conditions.threshold);
          break;
          
        case TriggerType.EXPERIMENT_CONCLUSION:
          if (trigger.conditions.experimentId) {
            await this.generateExperimentConclusion(trigger.conditions.experimentId);
          }
          break;
      }
    } catch (error) {
      logger.error({ error, triggerId: trigger.id }, 'Error generating trigger insight');
    }
  }
  
  /**
   * Generate insight for subscription dip
   */
  private async generateInsightForSubscriptionDip(threshold: number): Promise<void> {
    // Stub implementation
    logger.info(`Generated insight for subscription dip with threshold ${threshold}`);
  }
  
  /**
   * Generate insight for positive ROI
   */
  private async generateInsightForPositiveROI(threshold: number): Promise<void> {
    // Stub implementation
    logger.info(`Generated insight for positive ROI with threshold ${threshold}`);
  }
  
  /**
   * Generate insight for campaign underperformance
   */
  private async generateInsightForCampaignUnderperformance(threshold: number): Promise<void> {
    // Stub implementation
    logger.info(`Generated insight for campaign underperformance with threshold ${threshold}`);
  }
  
  /**
   * Generate experiment conclusion
   */
  private async generateExperimentConclusion(experimentId: string): Promise<void> {
    // Stub implementation
    logger.info(`Generated experiment conclusion for experiment ${experimentId}`);
  }
  
  /**
   * Helper to get start date for a time frame
   */
  private getTimeFrameStartDate(timeFrame: string): Date {
    const now = new Date();
    switch (timeFrame) {
      case 'day':
        now.setDate(now.getDate() - 1);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      default:
        now.setDate(now.getDate() - 1); // Default to day
    }
    return now;
  }
  
  /**
   * Helper to get double the time frame (for previous period comparison)
   */
  private getDoubleTimeFrame(timeFrame: string): string {
    switch (timeFrame) {
      case 'day':
        return 'week';
      case 'week':
        return 'month';
      case 'month':
        return 'month'; // Can't really double a month in this simple system
      default:
        return 'week';
    }
  }
  
  /**
   * Entry point for scheduled process to check all triggers
   */
  async processTriggers(): Promise<void> {
    await this.monitorAllClients();
  }
}

export function triggerEngine(...args: any[]) {
  // TODO: implement orchestration logic
  return Promise.resolve();
}

// Export TriggerType for use in mocks and tests
triggerEngine.TriggerType = TriggerType;

export { TriggerType, triggerEngine }; 