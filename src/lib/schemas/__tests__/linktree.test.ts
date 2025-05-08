import {
  LinkItemSchema,
  LinktreeConfigSchema,
  LinktreeUpdateSchema,
  LinktreeResponseSchema,
  GenerateSuggestionsSchema,
} from '../linktree';

describe('Linktree Schema Validation', () => {
  describe('LinkItemSchema', () => {
    it('should validate a valid link item', () => {
      const validLinkItem = {
        title: 'My Instagram',
        url: 'https://instagram.com/myusername',
      };

      const result = LinkItemSchema.safeParse(validLinkItem);
      expect(result.success).toBe(true);
    });

    it('should reject an empty title', () => {
      const invalidLinkItem = {
        title: '',
        url: 'https://instagram.com/myusername',
      };

      const result = LinkItemSchema.safeParse(invalidLinkItem);
      expect(result.success).toBe(false);
    });

    it('should reject an invalid URL', () => {
      const invalidLinkItem = {
        title: 'My Instagram',
        url: 'not-a-valid-url',
      };

      const result = LinkItemSchema.safeParse(invalidLinkItem);
      expect(result.success).toBe(false);
    });
  });

  describe('LinktreeConfigSchema', () => {
    it('should validate a complete valid config', () => {
      const validConfig = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
          {
            title: 'My OnlyFans',
            url: 'https://onlyfans.com/myusername',
          },
        ],
        theme: 'dark',
      };

      const result = LinktreeConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate without optional theme', () => {
      const validConfig = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
        ],
      };

      const result = LinktreeConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate with empty links array', () => {
      const validConfig = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        links: [],
      };

      const result = LinktreeConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid userId', () => {
      const invalidConfig = {
        userId: 'not-a-uuid',
        links: [],
      };

      const result = LinktreeConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject with invalid link items', () => {
      const invalidConfig = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        links: [
          {
            title: 'Valid Title',
            url: 'https://example.com',
          },
          {
            title: '',
            url: 'not-a-url',
          },
        ],
      };

      const result = LinktreeConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('LinktreeUpdateSchema', () => {
    it('should validate a complete valid update', () => {
      const validUpdate = {
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
          {
            title: 'My OnlyFans',
            url: 'https://onlyfans.com/myusername',
          },
        ],
        theme: 'dark',
      };

      const result = LinktreeUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate without optional theme', () => {
      const validUpdate = {
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
        ],
      };

      const result = LinktreeUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate with empty links array', () => {
      const validUpdate = {
        links: [],
      };

      const result = LinktreeUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid link items', () => {
      const invalidUpdate = {
        links: [
          {
            title: 'Valid Title',
            url: 'https://example.com',
          },
          {
            title: '',
            url: 'not-a-url',
          },
        ],
      };

      const result = LinktreeUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('LinktreeResponseSchema', () => {
    it('should validate a complete response', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
        ],
        theme: 'dark',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = LinktreeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate with null theme', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        links: [
          {
            title: 'My Instagram',
            url: 'https://instagram.com/myusername',
          },
        ],
        theme: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = LinktreeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject with missing required fields', () => {
      const invalidResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        // Missing userId
        links: [],
        theme: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = LinktreeResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject with invalid link items', () => {
      const invalidResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        links: [
          {
            title: '',
            url: 'not-a-url',
          },
        ],
        theme: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = LinktreeResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('GenerateSuggestionsSchema', () => {
    it('should validate with valid userId', () => {
      const validSuggestion = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = GenerateSuggestionsSchema.safeParse(validSuggestion);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid userId format', () => {
      const invalidSuggestion = {
        userId: 'not-a-uuid',
      };

      const result = GenerateSuggestionsSchema.safeParse(invalidSuggestion);
      expect(result.success).toBe(false);
    });

    it('should reject with missing userId', () => {
      const invalidSuggestion = {};

      const result = GenerateSuggestionsSchema.safeParse(invalidSuggestion);
      expect(result.success).toBe(false);
    });
  });
}); 