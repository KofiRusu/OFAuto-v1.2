import { describe, it, expect } from 'vitest';
import {
  ChatbotAutomationCreateSchema,
  ChatbotAutomationUpdateSchema,
  TriggerTypeEnum,
  TriggerDataSchema,
  ActionTypeEnum,
  ActionSchema,
} from '@/lib/schemas/chatbotAutomation';

describe('ChatbotAutomation Schemas', () => {
  // Test TriggerTypeEnum
  describe('TriggerTypeEnum', () => {
    it('should accept valid trigger types', () => {
      expect(() => TriggerTypeEnum.parse('ON_SCHEDULE')).not.toThrow();
      expect(() => TriggerTypeEnum.parse('ON_EVENT')).not.toThrow();
      expect(() => TriggerTypeEnum.parse('ON_DEMAND')).not.toThrow();
      expect(() => TriggerTypeEnum.parse('ON_CONDITION')).not.toThrow();
    });

    it('should reject invalid trigger types', () => {
      expect(() => TriggerTypeEnum.parse('INVALID')).toThrow();
      expect(() => TriggerTypeEnum.parse('on_schedule')).toThrow(); // case sensitive
    });
  });

  // Test ActionTypeEnum
  describe('ActionTypeEnum', () => {
    it('should accept valid action types', () => {
      expect(() => ActionTypeEnum.parse('SEND_MESSAGE')).not.toThrow();
      expect(() => ActionTypeEnum.parse('GENERATE_CONTENT')).not.toThrow();
      expect(() => ActionTypeEnum.parse('API_CALL')).not.toThrow();
      expect(() => ActionTypeEnum.parse('UPDATE_DATA')).not.toThrow();
      expect(() => ActionTypeEnum.parse('NOTIFICATION')).not.toThrow();
    });

    it('should reject invalid action types', () => {
      expect(() => ActionTypeEnum.parse('INVALID')).toThrow();
      expect(() => ActionTypeEnum.parse('send_message')).toThrow(); // case sensitive
    });
  });

  // Test ActionSchema
  describe('ActionSchema', () => {
    it('should validate a valid action', () => {
      const validAction = {
        type: 'SEND_MESSAGE',
        name: 'test_action',
        config: {
          recipient: 'test@example.com',
          message: 'Hello {{user.name}}!',
          channel: 'email',
        },
        order: 0,
      };

      expect(() => ActionSchema.parse(validAction)).not.toThrow();
    });

    it('should require a name', () => {
      const invalidAction = {
        type: 'SEND_MESSAGE',
        name: '',
        config: {},
        order: 0,
      };

      expect(() => ActionSchema.parse(invalidAction)).toThrow();
    });

    it('should require a valid type', () => {
      const invalidAction = {
        type: 'INVALID',
        name: 'test_action',
        config: {},
        order: 0,
      };

      expect(() => ActionSchema.parse(invalidAction)).toThrow();
    });

    it('should require a non-negative order', () => {
      const invalidAction = {
        type: 'SEND_MESSAGE',
        name: 'test_action',
        config: {},
        order: -1,
      };

      expect(() => ActionSchema.parse(invalidAction)).toThrow();
    });
  });

  // Test TriggerDataSchema
  describe('TriggerDataSchema', () => {
    it('should validate a valid schedule trigger', () => {
      const validScheduleTrigger = {
        type: 'ON_SCHEDULE',
        cronExpression: '0 0 * * *',
        timezone: 'UTC',
      };

      expect(() => TriggerDataSchema.parse(validScheduleTrigger)).not.toThrow();
    });

    it('should validate a valid event trigger', () => {
      const validEventTrigger = {
        type: 'ON_EVENT',
        eventType: 'message_received',
        eventFilter: {
          platform: 'twitter',
        },
      };

      expect(() => TriggerDataSchema.parse(validEventTrigger)).not.toThrow();
    });

    it('should validate a valid condition trigger', () => {
      const validConditionTrigger = {
        type: 'ON_CONDITION',
        condition: {
          field: 'user.status',
          operator: 'equals',
          value: 'active',
        },
        evaluationFrequency: 'hourly',
      };

      expect(() => TriggerDataSchema.parse(validConditionTrigger)).not.toThrow();
    });

    it('should validate a valid on-demand trigger', () => {
      const validOnDemandTrigger = {
        type: 'ON_DEMAND',
      };

      expect(() => TriggerDataSchema.parse(validOnDemandTrigger)).not.toThrow();
    });

    it('should require a cron expression for schedule triggers', () => {
      const invalidScheduleTrigger = {
        type: 'ON_SCHEDULE',
        cronExpression: '',
      };

      expect(() => TriggerDataSchema.parse(invalidScheduleTrigger)).toThrow();
    });

    it('should require an event type for event triggers', () => {
      const invalidEventTrigger = {
        type: 'ON_EVENT',
        eventType: '',
      };

      expect(() => TriggerDataSchema.parse(invalidEventTrigger)).toThrow();
    });
  });

  // Test ChatbotAutomationCreateSchema
  describe('ChatbotAutomationCreateSchema', () => {
    it('should validate a valid automation creation', () => {
      const validAutomation = {
        name: 'Test Automation',
        personaId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        triggerType: 'ON_SCHEDULE',
        triggerData: {
          type: 'ON_SCHEDULE',
          cronExpression: '0 0 * * *',
          timezone: 'UTC',
        },
        actions: [
          {
            type: 'SEND_MESSAGE',
            name: 'send_email',
            config: {
              recipient: 'test@example.com',
              message: 'Hello {{user.name}}!',
              channel: 'email',
            },
            order: 0,
          },
        ],
        isActive: true,
      };

      expect(() => ChatbotAutomationCreateSchema.parse(validAutomation)).not.toThrow();
    });

    it('should require a name with minimum length', () => {
      const invalidAutomation = {
        name: 'Te',
        personaId: '123e4567-e89b-12d3-a456-426614174000',
        triggerType: 'ON_SCHEDULE',
        triggerData: {
          type: 'ON_SCHEDULE',
          cronExpression: '0 0 * * *',
        },
        actions: [
          {
            type: 'SEND_MESSAGE',
            name: 'send_email',
            config: {},
            order: 0,
          },
        ],
        isActive: true,
      };

      expect(() => ChatbotAutomationCreateSchema.parse(invalidAutomation)).toThrow();
    });

    it('should require a valid UUID for personaId', () => {
      const invalidAutomation = {
        name: 'Test Automation',
        personaId: 'not-a-uuid',
        triggerType: 'ON_SCHEDULE',
        triggerData: {
          type: 'ON_SCHEDULE',
          cronExpression: '0 0 * * *',
        },
        actions: [
          {
            type: 'SEND_MESSAGE',
            name: 'send_email',
            config: {},
            order: 0,
          },
        ],
        isActive: true,
      };

      expect(() => ChatbotAutomationCreateSchema.parse(invalidAutomation)).toThrow();
    });

    it('should require at least one action', () => {
      const invalidAutomation = {
        name: 'Test Automation',
        personaId: '123e4567-e89b-12d3-a456-426614174000',
        triggerType: 'ON_SCHEDULE',
        triggerData: {
          type: 'ON_SCHEDULE',
          cronExpression: '0 0 * * *',
        },
        actions: [],
        isActive: true,
      };

      expect(() => ChatbotAutomationCreateSchema.parse(invalidAutomation)).toThrow();
    });
  });

  // Test ChatbotAutomationUpdateSchema
  describe('ChatbotAutomationUpdateSchema', () => {
    it('should validate a valid automation update', () => {
      const validUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Automation',
        isActive: false,
      };

      expect(() => ChatbotAutomationUpdateSchema.parse(validUpdate)).not.toThrow();
    });

    it('should require a valid UUID for id', () => {
      const invalidUpdate = {
        id: 'not-a-uuid',
        name: 'Updated Automation',
      };

      expect(() => ChatbotAutomationUpdateSchema.parse(invalidUpdate)).toThrow();
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        isActive: false,
      };

      expect(() => ChatbotAutomationUpdateSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should validate actions if provided', () => {
      const updateWithInvalidAction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        actions: [],
      };

      expect(() => ChatbotAutomationUpdateSchema.parse(updateWithInvalidAction)).toThrow();
    });
  });
}); 