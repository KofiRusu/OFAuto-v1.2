import { parseTemplateVariables } from "../utils/template";
import { logger } from "../logger";

// In a real implementation, this would use actual OpenAI API calls
// This is a mock implementation for demonstration purposes

interface VariationOptions {
  tones?: string[];
  preserveVariables?: boolean;
  maxLength?: number;
}

const DEFAULT_OPTIONS: VariationOptions = {
  tones: ["friendly", "professional", "casual"],
  preserveVariables: true,
  maxLength: 500,
};

/**
 * Generate stylistic variations of a template message
 * 
 * @param template Original template text
 * @param numVariations Number of variations to generate (default: 3)
 * @param options Options for generation
 * @returns Array of template variations
 */
export async function generateTemplateVariations(
  template: string,
  numVariations: number = 3,
  options: VariationOptions = {}
): Promise<string[]> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // In a production environment, this would be a real API call to OpenAI
    // For now, we'll use a mock implementation
    logger.info(`Generating ${numVariations} variations for template`);
    
    // Extract variables to preserve them in the variations
    const variables = parseTemplateVariables(template);
    
    // Mock variations with preserved variables
    return mockGenerateVariations(template, variables, numVariations, mergedOptions);
  } catch (error) {
    logger.error("Error generating template variations:", error);
    return [template]; // Return original template as fallback
  }
}

/**
 * Mock implementation of generateTemplateVariations
 * In a real implementation, this would use the OpenAI API
 */
function mockGenerateVariations(
  template: string,
  variables: string[],
  numVariations: number,
  options: VariationOptions
): string[] {
  // Remove variables from template to create base text
  let baseText = template;
  variables.forEach(variable => {
    baseText = baseText.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), `__${variable}__`);
  });

  // Generate variations with different styles
  const variations: string[] = [];
  const tones = options.tones || [];

  for (let i = 0; i < numVariations; i++) {
    const tone = tones[i % tones.length];
    
    // Apply tone transformations based on selected tone
    let variation = transformTextByTone(baseText, tone);
    
    // Restore variables if needed
    if (options.preserveVariables) {
      variables.forEach(variable => {
        variation = variation.replace(
          new RegExp(`__${variable}__`, 'g'), 
          `{{${variable}}}`
        );
      });
    }
    
    variations.push(variation);
  }

  return variations;
}

/**
 * Transform text based on tone
 * In a real implementation, this would use AI to generate variations
 */
function transformTextByTone(text: string, tone: string): string {
  const sentenceEnds = ['!', '.', '?'];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  switch (tone) {
    case 'friendly':
      return sentences.map(sentence => {
        // Add emojis, exclamations, friendly phrases
        const end = sentence.charAt(sentence.length - 1);
        if (sentenceEnds.includes(end)) {
          const newSentence = sentence.slice(0, -1);
          return Math.random() > 0.7 
            ? `${newSentence}! 😊` 
            : `${newSentence}${end}`;
        }
        return sentence;
      }).join(' ');
      
    case 'professional':
      return sentences.map(sentence => {
        // More formal language, avoid contractions
        return sentence
          .replace(/don't/g, 'do not')
          .replace(/can't/g, 'cannot')
          .replace(/won't/g, 'will not')
          .replace(/I'm/g, 'I am');
      }).join(' ');
      
    case 'casual':
      return sentences.map(sentence => {
        // More casual language, contractions, shorter sentences
        return sentence
          .replace(/do not/g, "don't")
          .replace(/cannot/g, "can't")
          .replace(/will not/g, "won't")
          .replace(/I am/g, "I'm");
      }).join(' ');
      
    case 'enthusiastic':
      return sentences.map(sentence => {
        const end = sentence.charAt(sentence.length - 1);
        if (end === '.') {
          return `${sentence.slice(0, -1)}! ✨`;
        }
        if (end === '!') {
          return `${sentence}✨`;
        }
        return sentence;
      }).join(' ');
      
    default:
      return text;
  }
}

/**
 * Generate a variation in a specific format (e.g., shorter, bullet points)
 * This is an extension that could be used for different formats
 */
export async function generateFormattedVariation(
  template: string,
  format: 'short' | 'bullets' | 'paragraph',
  options: VariationOptions = {}
): Promise<string> {
  const variables = parseTemplateVariables(template);
  let formatted = template;
  
  switch (format) {
    case 'short':
      // Create a shorter version
      formatted = template
        .split(/(?<=[.!?])\s+/)
        .slice(0, 2)
        .join(' ');
      break;
      
    case 'bullets':
      // Convert to bullet points
      formatted = template
        .split(/(?<=[.!?])\s+/)
        .map(s => `• ${s}`)
        .join('\n');
      break;
      
    case 'paragraph':
      // Keep as a single paragraph
      formatted = template.replace(/\n/g, ' ');
      break;
  }
  
  // Restore variables
  if (options.preserveVariables) {
    variables.forEach(variable => {
      formatted = formatted.replace(
        new RegExp(`__${variable}__`, 'g'), 
        `{{${variable}}}`
      );
    });
  }
  
  return formatted;
} 