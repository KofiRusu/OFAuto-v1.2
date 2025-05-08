import { PrismaClient } from '@prisma/client';
import { 
  ChatbotAutomationCreate, 
  ChatbotAutomationUpdate,
  TriggerData,
  Action,
  ChatbotAutomationQuery
} from '@/lib/schemas/chatbotAutomation';
import OpenAI from 'openai';
import { Logger } from '@/lib/utils/logger';
import { ChatCompletionRequestMessage } from 'openai';
import { ChatbotAutomation, ChatbotPersona } from '@prisma/client';
import { openai } from '@/lib/openai';
import { logger } from '@/lib/telemetry/logger';
import { TriggerTypeEnum, ActionTypeEnum } from '@/lib/schemas/chatbotAutomation';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const logger = new Logger('ChatbotAutomationService');

type ActionConfig = {
  type: ActionTypeEnum;
  content: string;
  delay?: number;
  condition?: string;
};

type TriggerConfig = {
  type: TriggerTypeEnum;
  schedule?: string;
  eventName?: string;
  condition?: string;
};

export class ChatbotAutomationService {
  /**
   * Create a new chatbot automation
   */
  static async createAutomation(data: ChatbotAutomationCreate, createdById: string) {
    try {
      // Validate persona existence
      const persona = await prisma.chatbotPersona.findUnique({
        where: { id: data.personaId },
      });

      if (!persona) {
        throw new Error(`Persona with ID ${data.personaId} not found`);
      }

      // Create automation
      const automation = await prisma.chatbotAutomation.create({
        data: {
          name: data.name,
          personaId: data.personaId,
          triggerType: data.triggerType,
          triggerData: data.triggerData as any,
          actions: data.actions as any,
          isActive: data.isActive,
          createdBy: createdById,
        },
      });

      // If it's a scheduled automation, register it with the scheduler
      if (data.triggerType === 'ON_SCHEDULE') {
        await this.scheduleAutomation(automation.id, data.triggerData as any);
      }

      return automation;
    } catch (error) {
      logger.error('Error creating automation', error);
      throw error;
    }
  }

  /**
   * Get all automations with optional filtering
   */
  static async getAutomations(query: ChatbotAutomationQuery = {}) {
    try {
      const where: any = {};
      
      if (query.personaId) {
        where.personaId = query.personaId;
      }
      
      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      const automations = await prisma.chatbotAutomation.findMany({
        where,
        include: {
          persona: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return automations;
    } catch (error) {
      logger.error('Error fetching automations', error);
      throw error;
    }
  }

  /**
   * Get a single automation by ID
   */
  static async getAutomationById(id: string) {
    try {
      const automation = await prisma.chatbotAutomation.findUnique({
        where: { id },
        include: {
          persona: {
            select: {
              id: true,
              name: true,
              systemPrompt: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!automation) {
        throw new Error(`Automation with ID ${id} not found`);
      }

      return automation;
    } catch (error) {
      logger.error(`Error fetching automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Update an existing automation
   */
  static async updateAutomation(data: ChatbotAutomationUpdate) {
    try {
      // Check if automation exists
      const existing = await prisma.chatbotAutomation.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        throw new Error(`Automation with ID ${data.id} not found`);
      }

      // If changing persona, validate the new one exists
      if (data.personaId && data.personaId !== existing.personaId) {
        const persona = await prisma.chatbotPersona.findUnique({
          where: { id: data.personaId },
        });

        if (!persona) {
          throw new Error(`Persona with ID ${data.personaId} not found`);
        }
      }

      // Build update data
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.personaId) updateData.personaId = data.personaId;
      if (data.triggerType) updateData.triggerType = data.triggerType;
      if (data.triggerData) updateData.triggerData = data.triggerData;
      if (data.actions) updateData.actions = data.actions;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Update the automation
      const updated = await prisma.chatbotAutomation.update({
        where: { id: data.id },
        data: updateData,
      });

      // If trigger type or data changed and it's a scheduled automation, update the schedule
      if ((data.triggerType || data.triggerData) && 
          (updated.triggerType === 'ON_SCHEDULE')) {
        await this.updateSchedule(updated.id, updated.triggerData as any);
      }

      return updated;
    } catch (error) {
      logger.error(`Error updating automation ${data.id}`, error);
      throw error;
    }
  }

  /**
   * Delete an automation
   */
  static async deleteAutomation(id: string) {
    try {
      // Check if automation exists
      const existing = await prisma.chatbotAutomation.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Automation with ID ${id} not found`);
      }

      // If it's scheduled, remove it from the scheduler
      if (existing.triggerType === 'ON_SCHEDULE') {
        await this.removeSchedule(id);
      }

      // Delete the automation
      await prisma.chatbotAutomation.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      logger.error(`Error deleting automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Manually trigger an automation
   */
  static async triggerAutomation(id: string, inputs: Record<string, any> = {}) {
    try {
      const automation = await this.getAutomationById(id);

      if (!automation.isActive) {
        throw new Error(`Automation ${id} is not active`);
      }

      // Execute the automation
      const result = await this.executeActions(
        automation.id,
        automation.persona,
        automation.actions as any,
        inputs
      );

      return result;
    } catch (error) {
      logger.error(`Error triggering automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Schedule an automation based on its trigger data
   */
  private static async scheduleAutomation(id: string, triggerData: TriggerData) {
    try {
      // Implementation would depend on your scheduling infrastructure
      // For example, this could register with a job queue like Bull
      logger.info(`Scheduling automation ${id} with trigger data:`, triggerData);
      
      // Example pseudo-code for scheduling:
      // const jobQueue = getJobQueue();
      // const cronExpression = (triggerData as ScheduleTriggerData).cronExpression;
      // await jobQueue.add('runChatbotAutomation', { id }, { repeat: { cron: cronExpression } });
      
      return { scheduled: true, id };
    } catch (error) {
      logger.error(`Error scheduling automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Update the schedule for an automation
   */
  private static async updateSchedule(id: string, triggerData: TriggerData) {
    try {
      // First remove the existing schedule
      await this.removeSchedule(id);
      
      // Then create a new schedule
      return await this.scheduleAutomation(id, triggerData);
    } catch (error) {
      logger.error(`Error updating schedule for automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Remove a scheduled automation
   */
  private static async removeSchedule(id: string) {
    try {
      // Implementation would depend on your scheduling infrastructure
      logger.info(`Removing schedule for automation ${id}`);
      
      // Example pseudo-code for removing a schedule:
      // const jobQueue = getJobQueue();
      // await jobQueue.removeRepeatable('runChatbotAutomation', { id });
      
      return { removed: true, id };
    } catch (error) {
      logger.error(`Error removing schedule for automation ${id}`, error);
      throw error;
    }
  }

  /**
   * Execute the actions for an automation
   */
  private static async executeActions(
    automationId: string,
    persona: any,
    actions: Action[],
    inputs: Record<string, any> = {}
  ) {
    try {
      logger.info(`Executing automation ${automationId} with ${actions.length} actions`);
      
      // Sort actions by order
      const sortedActions = [...actions].sort((a, b) => a.order - b.order);
      
      // Results from previous actions that can be used by later actions
      const results: Record<string, any> = { ...inputs };
      
      // Execute each action in sequence
      for (const action of sortedActions) {
        logger.info(`Executing action ${action.name} of type ${action.type}`);
        
        // Execute the action based on its type
        switch (action.type) {
          case 'SEND_MESSAGE':
            results[action.name] = await this.executeSendMessage(action, persona, results);
            break;
            
          case 'GENERATE_CONTENT':
            results[action.name] = await this.executeGenerateContent(action, persona, results);
            break;
            
          case 'API_CALL':
            results[action.name] = await this.executeApiCall(action, results);
            break;
            
          case 'UPDATE_DATA':
            results[action.name] = await this.executeUpdateData(action, results);
            break;
            
          case 'NOTIFICATION':
            results[action.name] = await this.executeNotification(action, results);
            break;
            
          default:
            logger.warn(`Unknown action type: ${action.type}`);
            results[action.name] = { error: `Unknown action type: ${action.type}` };
        }
      }
      
      return {
        success: true,
        automationId,
        results,
      };
    } catch (error) {
      logger.error(`Error executing automation ${automationId}`, error);
      throw error;
    }
  }

  /**
   * Execute a SEND_MESSAGE action
   */
  private static async executeSendMessage(action: Action, persona: any, context: Record<string, any>) {
    try {
      const { recipient, message, channel } = action.config;
      
      // Process the message template with variables from context
      const processedMessage = this.processTemplate(message, context);
      
      logger.info(`Sending message to ${recipient} via ${channel}: ${processedMessage.substring(0, 50)}...`);
      
      // Example implementation for different channels
      switch (channel) {
        case 'email':
          // Send email using your email service
          // await emailService.send(recipient, processedMessage);
          break;
          
        case 'sms':
          // Send SMS using your SMS service
          // await smsService.send(recipient, processedMessage);
          break;
          
        case 'push':
          // Send push notification
          // await pushService.send(recipient, processedMessage);
          break;
          
        default:
          throw new Error(`Unsupported message channel: ${channel}`);
      }
      
      return {
        success: true,
        recipient,
        channel,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error executing SEND_MESSAGE action`, error);
      throw error;
    }
  }

  /**
   * Execute a GENERATE_CONTENT action
   */
  private static async executeGenerateContent(action: Action, persona: any, context: Record<string, any>) {
    try {
      const { promptTemplate, model, maxTokens } = action.config;
      
      // Process the prompt template with variables from context
      const processedPrompt = this.processTemplate(promptTemplate, context);
      
      logger.info(`Generating content with model ${model} using prompt: ${processedPrompt.substring(0, 50)}...`);
      
      // Call OpenAI to generate content
      const response = await openai.chat.completions.create({
        model: model || 'gpt-4-turbo',
        messages: [
          { role: 'system', content: persona.systemPrompt },
          { role: 'user', content: processedPrompt }
        ],
        max_tokens: maxTokens || 1000,
      });
      
      const generatedContent = response.choices[0]?.message?.content || '';
      
      return {
        success: true,
        content: generatedContent,
        model,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error executing GENERATE_CONTENT action`, error);
      throw error;
    }
  }

  /**
   * Execute an API_CALL action
   */
  private static async executeApiCall(action: Action, context: Record<string, any>) {
    try {
      const { url, method, headers, body } = action.config;
      
      // Process URL, headers, and body templates with variables from context
      const processedUrl = this.processTemplate(url, context);
      const processedHeaders = Object.entries(headers || {}).reduce((acc, [key, value]) => {
        acc[key] = this.processTemplate(value as string, context);
        return acc;
      }, {} as Record<string, string>);
      
      let processedBody = body;
      if (typeof body === 'string') {
        processedBody = this.processTemplate(body, context);
      } else if (body && typeof body === 'object') {
        processedBody = JSON.parse(
          this.processTemplate(JSON.stringify(body), context)
        );
      }
      
      logger.info(`Making API call to ${processedUrl} with method ${method}`);
      
      // Make the API call
      const response = await fetch(processedUrl, {
        method: method || 'GET',
        headers: processedHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(method || '') 
          ? JSON.stringify(processedBody)
          : undefined,
      });
      
      const responseData = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: responseData,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error executing API_CALL action`, error);
      throw error;
    }
  }

  /**
   * Execute an UPDATE_DATA action
   */
  private static async executeUpdateData(action: Action, context: Record<string, any>) {
    try {
      const { entity, entityId, data } = action.config;
      
      // Process entityId and data templates with variables from context
      const processedEntityId = this.processTemplate(entityId, context);
      const processedData = JSON.parse(
        this.processTemplate(JSON.stringify(data), context)
      );
      
      logger.info(`Updating ${entity} with ID ${processedEntityId}`);
      
      // Update the specified entity in the database
      let result;
      switch (entity) {
        case 'user':
          result = await prisma.user.update({
            where: { id: processedEntityId },
            data: processedData,
          });
          break;
          
        case 'client':
          result = await prisma.client.update({
            where: { id: processedEntityId },
            data: processedData,
          });
          break;
          
        // Add cases for other entity types as needed
          
        default:
          throw new Error(`Unsupported entity type: ${entity}`);
      }
      
      return {
        success: true,
        entity,
        entityId: processedEntityId,
        updatedData: result,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error executing UPDATE_DATA action`, error);
      throw error;
    }
  }

  /**
   * Execute a NOTIFICATION action
   */
  private static async executeNotification(action: Action, context: Record<string, any>) {
    try {
      const { title, message, notificationType, recipients } = action.config;
      
      // Process title and message templates with variables from context
      const processedTitle = this.processTemplate(title, context);
      const processedMessage = this.processTemplate(message, context);
      
      logger.info(`Sending ${notificationType} notification: ${processedTitle}`);
      
      // Send notification using your notification service
      // For example:
      // await notificationService.send({
      //   title: processedTitle,
      //   message: processedMessage,
      //   type: notificationType,
      //   recipients,
      // });
      
      return {
        success: true,
        title: processedTitle,
        message: processedMessage,
        type: notificationType,
        recipients,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error executing NOTIFICATION action`, error);
      throw error;
    }
  }

  /**
   * Process a template string with variables from context
   */
  private static processTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const path = key.trim().split('.');
      let value = context;
      
      for (const segment of path) {
        if (value === undefined || value === null) return match;
        value = value[segment];
      }
      
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Generate a chatbot automation from a natural language prompt
   */
  async generateFromPrompt(prompt: string, userId: string): Promise<{
    name: string;
    description: string;
    suggestedPersonaId?: string;
    triggerType: TriggerTypeEnum;
    triggerData: TriggerConfig;
    actions: ActionConfig[];
  }> {
    try {
      // Construct the system prompt
      const messages: ChatCompletionRequestMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant that creates chatbot automations from natural language prompts.
          Generate a structured automation with a name, description, trigger type, and actions.
          Valid trigger types are: ${Object.values(TriggerTypeEnum).join(', ')}
          Valid action types are: ${Object.values(ActionTypeEnum).join(', ')}
          
          Structure your response as valid JSON with the following format:
          {
            "name": "Name of the automation",
            "description": "Brief description of what this automation does",
            "triggerType": "ON_SCHEDULE or ON_EVENT",
            "triggerData": {
              "type": "One of the trigger types",
              "schedule": "Cron expression if schedule-based",
              "eventName": "Name of event if event-based",
              "condition": "Optional condition"
            },
            "actions": [
              {
                "type": "Action type",
                "content": "The content/message to send",
                "delay": 0,
                "condition": "Optional condition"
              }
            ]
          }`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Call the OpenAI API
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Failed to generate automation from prompt');
      }

      // Extract the JSON from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/{[\s\S]*?}/);
      
      const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : content;
      
      // Parse the JSON
      const automation = JSON.parse(jsonString);
      
      // Validate the generated automation 
      if (!automation.name || !automation.triggerType || !automation.actions || !Array.isArray(automation.actions)) {
        throw new Error('Invalid automation structure generated');
      }

      return {
        name: automation.name,
        description: automation.description || 'Generated from prompt',
        suggestedPersonaId: automation.suggestedPersonaId,
        triggerType: automation.triggerType as TriggerTypeEnum,
        triggerData: automation.triggerData,
        actions: automation.actions,
      };
    } catch (error) {
      logger.error('Error generating automation from prompt', { error, userId, prompt });
      throw new Error('Failed to generate automation from prompt. Please try again with a more specific description.');
    }
  }

  /**
   * List potential automations from a natural language prompt
   */
  async listFromPrompt(prompt: string, userId: string, count: number = 3): Promise<Array<{
    name: string;
    description: string;
    triggerType: TriggerTypeEnum;
  }>> {
    try {
      // Construct the system prompt
      const messages: ChatCompletionRequestMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant that suggests chatbot automations from natural language prompts.
          Generate ${count} different automation ideas with a name, description, and trigger type.
          Valid trigger types are: ${Object.values(TriggerTypeEnum).join(', ')}
          
          Structure your response as valid JSON with the following format:
          [
            {
              "name": "Name of automation 1",
              "description": "Brief description of what this automation does",
              "triggerType": "ON_SCHEDULE or ON_EVENT"
            },
            {
              "name": "Name of automation 2",
              "description": "Brief description of what this automation does",
              "triggerType": "ON_SCHEDULE or ON_EVENT"
            },
            ...
          ]`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Call the OpenAI API
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages,
        temperature: 0.8,
        max_tokens: 1000,
      });

      const content = response.data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Failed to generate automation suggestions');
      }

      // Extract the JSON from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/\[([\s\S]*?)\]/);
      
      const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : content;
      
      // Parse the JSON
      const suggestions = JSON.parse(jsonString);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Invalid suggestions format');
      }

      return suggestions.map(suggestion => ({
        name: suggestion.name,
        description: suggestion.description || 'Generated from prompt',
        triggerType: suggestion.triggerType as TriggerTypeEnum,
      }));
    } catch (error) {
      logger.error('Error generating automation suggestions', { error, userId, prompt });
      throw new Error('Failed to generate automation suggestions. Please try again with a more specific description.');
    }
  }

  /**
   * Execute a chatbot automation
   */
  async executeAutomation(automationId: string, context: Record<string, any> = {}): Promise<{
    success: boolean;
    results: any[];
  }> {
    try {
      // In a real implementation, this would:
      // 1. Fetch the automation from the database
      // 2. Parse its actions
      // 3. Execute each action in sequence
      // 4. Log the results
      // 5. Return success/failure
      
      // For now, we'll just return a mock success
      logger.info('Executing automation', { automationId, context });
      
      return {
        success: true,
        results: [
          { action: 'SEND_MESSAGE', status: 'completed' },
          { action: 'CALL_API', status: 'completed' }
        ]
      };
    } catch (error) {
      logger.error('Error executing automation', { error, automationId });
      throw new Error('Failed to execute automation');
    }
  }
}

// Export singleton instance
export const chatbotAutomationService = new ChatbotAutomationService(); 