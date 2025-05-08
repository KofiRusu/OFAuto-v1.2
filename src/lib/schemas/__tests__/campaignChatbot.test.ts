import { 
  CampaignIdeaSchema,
  CampaignIdeaRequestSchema,
  CampaignIdeaResponseSchema
} from '../campaignChatbot';

describe('Campaign Chatbot Schemas', () => {
  describe('CampaignIdeaSchema', () => {
    it('should validate a valid idea', () => {
      const validIdea = {
        title: 'Test Campaign Idea',
        description: 'This is a description of the campaign idea.'
      };

      const result = CampaignIdeaSchema.safeParse(validIdea);
      expect(result.success).toBe(true);
    });

    it('should reject an empty title', () => {
      const invalidIdea = {
        title: '',
        description: 'This is a description of the campaign idea.'
      };

      const result = CampaignIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });

    it('should reject an empty description', () => {
      const invalidIdea = {
        title: 'Test Campaign Idea',
        description: ''
      };

      const result = CampaignIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });

    it('should reject missing properties', () => {
      const invalidIdea = {
        title: 'Test Campaign Idea'
      };

      const result = CampaignIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });
  });

  describe('CampaignIdeaRequestSchema', () => {
    it('should validate with only required context', () => {
      const validRequest = {
        context: 'I need campaign ideas for my fitness content.'
      };

      const result = CampaignIdeaRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const validRequest = {
        context: 'I need campaign ideas for my fitness content.',
        platform: 'Instagram',
        targetAudience: '18-35 year old fitness enthusiasts',
        budget: 500,
        goals: 'Increase follower count by 20%'
      };

      const result = CampaignIdeaRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject with empty context', () => {
      const invalidRequest = {
        context: '',
        platform: 'Instagram'
      };

      const result = CampaignIdeaRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject with too short context', () => {
      const invalidRequest = {
        context: 'Too short',
        platform: 'Instagram'
      };

      const result = CampaignIdeaRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject with negative budget', () => {
      const invalidRequest = {
        context: 'I need campaign ideas for my fitness content.',
        budget: -100
      };

      const result = CampaignIdeaRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('CampaignIdeaResponseSchema', () => {
    it('should validate with empty ideas array', () => {
      const validResponse = {
        ideas: []
      };

      const result = CampaignIdeaResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate with ideas array', () => {
      const validResponse = {
        ideas: [
          {
            title: 'Idea 1',
            description: 'Description 1'
          },
          {
            title: 'Idea 2',
            description: 'Description 2'
          }
        ]
      };

      const result = CampaignIdeaResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid idea', () => {
      const invalidResponse = {
        ideas: [
          {
            title: 'Idea 1',
            description: 'Description 1'
          },
          {
            title: '',
            description: 'Description 2'
          }
        ]
      };

      const result = CampaignIdeaResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject with missing ideas property', () => {
      const invalidResponse = {};

      const result = CampaignIdeaResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
}); 