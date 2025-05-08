import { generateTemplateVariations, generateFormattedVariation } from './variationGenerator';

// Mock the logger to avoid test pollution
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Variation Generator', () => {
  describe('generateTemplateVariations', () => {
    it('should generate requested number of variations', async () => {
      const template = 'Hello! Thanks for following me.';
      const numVariations = 3;
      
      const variations = await generateTemplateVariations(template, numVariations);
      
      expect(variations.length).toBe(numVariations);
      expect(variations[0]).not.toBe(variations[1]); // Variations should be different
    });
    
    it('should preserve template variables in variations', async () => {
      const template = 'Hello {{username}}! Thanks for following me on {{platform}}.';
      const numVariations = 2;
      
      const variations = await generateTemplateVariations(template, numVariations);
      
      variations.forEach(variation => {
        expect(variation).toContain('{{username}}');
        expect(variation).toContain('{{platform}}');
      });
    });
    
    it('should handle errors gracefully and return original template', async () => {
      // Simulate an error condition by passing invalid options
      const template = 'Hello {{username}}!';
      const badOptions = { tones: null } as any;
      
      const variations = await generateTemplateVariations(template, 2, badOptions);
      
      expect(variations.length).toBe(1);
      expect(variations[0]).toBe(template);
    });
  });
  
  describe('generateFormattedVariation', () => {
    it('should format template into bullet points', async () => {
      const template = 'Hello. How are you? Welcome to our service.';
      
      const formatted = await generateFormattedVariation(template, 'bullets');
      
      expect(formatted).toContain('• Hello');
      expect(formatted).toContain('• How are you?');
      expect(formatted).toContain('• Welcome to our service');
    });
    
    it('should create shorter version of template', async () => {
      const template = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      
      const formatted = await generateFormattedVariation(template, 'short');
      
      expect(formatted).toContain('First sentence');
      expect(formatted).toContain('Second sentence');
      expect(formatted).not.toContain('Fourth sentence');
    });
    
    it('should preserve variables in formatted output', async () => {
      const template = 'Hello {{username}}. Your trial ends on {{date}}.';
      
      const formatted = await generateFormattedVariation(template, 'bullets');
      
      expect(formatted).toContain('{{username}}');
      expect(formatted).toContain('{{date}}');
    });
  });
}); 