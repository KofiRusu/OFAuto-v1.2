import {
  parseTemplateVariables,
  applyTemplate,
  findMissingVariables,
  createTemplateSamplePreview
} from './template';

describe('Template utilities', () => {
  describe('parseTemplateVariables', () => {
    it('should extract variables from a template string', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}.';
      const variables = parseTemplateVariables(template);
      expect(variables).toContain('name');
      expect(variables).toContain('platform');
      expect(variables.length).toBe(2);
    });

    it('should return empty array for templates without variables', () => {
      const template = 'Hello there! This is a static message.';
      const variables = parseTemplateVariables(template);
      expect(variables).toEqual([]);
    });

    it('should handle empty template strings', () => {
      expect(parseTemplateVariables('')).toEqual([]);
      expect(parseTemplateVariables(undefined as any)).toEqual([]);
    });

    it('should deduplicate repeated variables', () => {
      const template = 'Hi {{name}}! Thanks for your interest in {{product}}. {{name}}, we hope you enjoy it!';
      const variables = parseTemplateVariables(template);
      expect(variables).toEqual(['name', 'product']);
      expect(variables.length).toBe(2);
    });
  });

  describe('applyTemplate', () => {
    it('should replace variables with their values', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}.';
      const values = { name: 'John', platform: 'Instagram' };
      const result = applyTemplate(template, values);
      expect(result).toBe('Hello John! Welcome to Instagram.');
    });

    it('should handle missing variables with default fallback', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}.';
      const values = { name: 'John' };
      const result = applyTemplate(template, values);
      expect(result).toBe('Hello John! Welcome to [missing].');
    });

    it('should handle missing variables with custom fallback', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}.';
      const values = { name: 'John' };
      const result = applyTemplate(template, values, '[not provided]');
      expect(result).toBe('Hello John! Welcome to [not provided].');
    });

    it('should handle empty template strings', () => {
      expect(applyTemplate('', {})).toBe('');
      expect(applyTemplate(undefined as any, {})).toBe('');
    });
  });

  describe('findMissingVariables', () => {
    it('should identify missing variables', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}. Your discount is {{discount}}.';
      const values = { name: 'John', platform: 'Instagram' };
      const missing = findMissingVariables(template, values);
      expect(missing).toEqual(['discount']);
    });

    it('should return empty array when all variables are provided', () => {
      const template = 'Hello {{name}}! Welcome to {{platform}}.';
      const values = { name: 'John', platform: 'Instagram' };
      const missing = findMissingVariables(template, values);
      expect(missing).toEqual([]);
    });

    it('should handle templates without variables', () => {
      const template = 'Hello there! This is a static message.';
      const missing = findMissingVariables(template, {});
      expect(missing).toEqual([]);
    });
  });

  describe('createTemplateSamplePreview', () => {
    it('should create a preview with sample values', () => {
      const template = 'Hello {{username}}! Welcome to {{platform}}. Today is {{day}}.';
      const preview = createTemplateSamplePreview(template);
      expect(preview).toContain('JohnDoe');
      expect(preview).toContain('Instagram');
      expect(preview).toContain('Monday');
    });

    it('should handle custom variables with generic sample values', () => {
      const template = 'Your {{custom_field}} is ready to view.';
      const preview = createTemplateSamplePreview(template);
      expect(preview).toContain('[sample custom_field]');
    });
  });
}); 