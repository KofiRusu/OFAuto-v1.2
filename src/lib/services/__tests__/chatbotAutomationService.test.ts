import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatbotAutomationService } from '../chatbotAutomationService';
import { openai } from '@/lib/openai';
import { TriggerTypeEnum, ActionTypeEnum } from '@/lib/schemas/chatbotAutomation';

// Mock the OpenAI module
vi.mock('@/lib/openai', () => ({
  openai: {
    createChatCompletion: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/telemetry/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ChatbotAutomationService', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('generateFromPrompt', () => {
    it('should generate automation from prompt', async () => {
      // Mock OpenAI response
      const mockAutomation = {
        name: 'Welcome Sequence',
        description: 'Send welcome messages to new users',
        triggerType: TriggerTypeEnum.enum.ON_EVENT,
        triggerData: {
          type: 'ON_EVENT',
          eventType: 'user.signup',
        },
        actions: [
          {
            type: ActionTypeEnum.enum.SEND_MESSAGE,
            content: 'Welcome to our platform!',
            delay: 0,
          },
          {
            type: ActionTypeEnum.enum.SEND_MESSAGE,
            content: 'Here are some tips to get started...',
            delay: 86400, // 1 day in seconds
          },
        ],
      };
      
      vi.mocked(openai.createChatCompletion).mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(mockAutomation),
              },
            },
          ],
        },
      } as any);
      
      // Call the service method
      const result = await chatbotAutomationService.generateFromPrompt(
        'Create a welcome sequence for new users',
        mockUserId
      );
      
      // Verify the result
      expect(result).toEqual({
        name: 'Welcome Sequence',
        description: 'Send welcome messages to new users',
        triggerType: TriggerTypeEnum.enum.ON_EVENT,
        triggerData: {
          type: 'ON_EVENT',
          eventType: 'user.signup',
        },
        actions: [
          {
            type: ActionTypeEnum.enum.SEND_MESSAGE,
            content: 'Welcome to our platform!',
            delay: 0,
          },
          {
            type: ActionTypeEnum.enum.SEND_MESSAGE,
            content: 'Here are some tips to get started...',
            delay: 86400,
          },
        ],
      });
      
      // Verify OpenAI was called correctly
      expect(openai.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Create a welcome sequence for new users',
            }),
          ]),
        })
      );
    });
    
    it('should handle JSON wrapped in code blocks', async () => {
      // Mock OpenAI response with code block formatting
      const mockResponse = `
      Here's an automation for you:
      
      \`\`\`json
      {
        "name": "Daily Reminder",
        "description": "Send daily reminders to users",
        "triggerType": "ON_SCHEDULE",
        "triggerData": {
          "type": "ON_SCHEDULE",
          "cronExpression": "0 9 * * *"
        },
        "actions": [
          {
            "type": "SEND_MESSAGE",
            "content": "Good morning! Here are your tasks for today.",
            "delay": 0
          }
        ]
      }
      \`\`\`
      `;
      
      vi.mocked(openai.createChatCompletion).mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: mockResponse,
              },
            },
          ],
        },
      } as any);
      
      // Call the service method
      const result = await chatbotAutomationService.generateFromPrompt(
        'Create a daily reminder automation',
        mockUserId
      );
      
      // Verify the result
      expect(result).toEqual({
        name: 'Daily Reminder',
        description: 'Send daily reminders to users',
        triggerType: TriggerTypeEnum.enum.ON_SCHEDULE,
        triggerData: {
          type: 'ON_SCHEDULE',
          cronExpression: '0 9 * * *',
        },
        actions: [
          {
            type: ActionTypeEnum.enum.SEND_MESSAGE,
            content: 'Good morning! Here are your tasks for today.',
            delay: 0,
          },
        ],
      });
    });
    
    it('should throw error when API fails', async () => {
      // Mock OpenAI API error
      vi.mocked(openai.createChatCompletion).mockRejectedValueOnce(
        new Error('API error')
      );
      
      // Expect the service to throw an error
      await expect(chatbotAutomationService.generateFromPrompt(
        'Create an automation',
        mockUserId
      )).rejects.toThrow('Failed to generate automation from prompt');
    });
    
    it('should throw error when response is invalid', async () => {
      // Mock invalid OpenAI response
      vi.mocked(openai.createChatCompletion).mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: '{"name": "Invalid Automation"}', // Missing required fields
              },
            },
          ],
        },
      } as any);
      
      // Expect the service to throw an error
      await expect(chatbotAutomationService.generateFromPrompt(
        'Create an automation',
        mockUserId
      )).rejects.toThrow('Invalid automation structure generated');
    });
  });
  
  describe('listFromPrompt', () => {
    it('should list automation suggestions from prompt', async () => {
      // Mock OpenAI response
      const mockSuggestions = [
        {
          name: 'Welcome Sequence',
          description: 'Send welcome messages to new users',
          triggerType: TriggerTypeEnum.enum.ON_EVENT,
        },
        {
          name: 'Weekly Newsletter',
          description: 'Send a weekly newsletter with updates',
          triggerType: TriggerTypeEnum.enum.ON_SCHEDULE,
        },
        {
          name: 'Inactivity Reminder',
          description: 'Send a reminder to users who have been inactive',
          triggerType: TriggerTypeEnum.enum.ON_CONDITION,
        },
      ];
      
      vi.mocked(openai.createChatCompletion).mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(mockSuggestions),
              },
            },
          ],
        },
      } as any);
      
      // Call the service method
      const result = await chatbotAutomationService.listFromPrompt(
        'Suggest automations for user engagement',
        mockUserId,
        3
      );
      
      // Verify the result
      expect(result).toEqual(mockSuggestions);
      
      // Verify OpenAI was called correctly
      expect(openai.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Suggest automations for user engagement',
            }),
          ]),
        })
      );
    });
  });
  
  describe('executeAutomation', () => {
    it('should execute an automation', async () => {
      const automationId = 'automation-123';
      const context = { userId: 'user-456' };
      
      // Call the service method
      const result = await chatbotAutomationService.executeAutomation(automationId, context);
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        results: [
          { action: 'SEND_MESSAGE', status: 'completed' },
          { action: 'CALL_API', status: 'completed' },
        ],
      });
    });
  });
}); 