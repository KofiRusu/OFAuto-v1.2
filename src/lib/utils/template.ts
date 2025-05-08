/**
 * Template utility functions for handling template variables and substitutions
 */

import { logger } from '@/lib/logger'
import type { PersonalizationData } from '@/lib/types/dm'

/**
 * Pattern to match template variables in the format {{variableName}}
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g

/**
 * Extracts variable names from a template string
 * @param template The template string containing variables in the format {{variableName}}
 * @returns Array of variable names
 */
export function parseTemplateVariables(template: string): string[] {
  const variables: string[] = []
  let match

  while ((match = VARIABLE_PATTERN.exec(template)) !== null) {
    variables.push(match[1].trim())
  }

  // Return unique variable names
  return [...new Set(variables)]
}

/**
 * Applies values to a template string
 * @param template The template string containing variables in the format {{variableName}}
 * @param values Object mapping variable names to their values
 * @param defaultFallback Optional default fallback for any variable without a value
 * @returns The template with all variables replaced with their values
 */
export function applyTemplate(
  template: string, 
  values: PersonalizationData = {}, 
  defaultFallback = ''
): string {
  if (!template) return ''

  return template.replace(VARIABLE_PATTERN, (match, variableName) => {
    const trimmedName = variableName.trim()
    
    // Check if the variable exists in values
    if (Object.prototype.hasOwnProperty.call(values, trimmedName)) {
      return values[trimmedName] || defaultFallback
    }
    
    // Handle fallback chain variables in format {{var1|var2|var3}}
    if (trimmedName.includes('|')) {
      const fallbackChain = trimmedName.split('|').map(v => v.trim())
      
      // Try each variable in the fallback chain
      for (const fallbackVar of fallbackChain) {
        if (Object.prototype.hasOwnProperty.call(values, fallbackVar) && values[fallbackVar]) {
          return values[fallbackVar]
        }
      }
    }
    
    // Log missing variables when in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Template variable not found: ${trimmedName}`)
    }
    
    // Return the original placeholder in development or defaultFallback in production
    return process.env.NODE_ENV === 'development' ? match : defaultFallback
  })
}

/**
 * Identifies variables in a template that don't have corresponding values
 * @param template The template string containing variables
 * @param values Object mapping variable names to their values
 * @returns Array of variable names that don't have values
 */
export function findMissingVariables(template: string, values: PersonalizationData = {}): string[] {
  const variables = parseTemplateVariables(template)
  const missingVariables: string[] = []

  for (const variable of variables) {
    // Handle fallback chain variables (var1|var2|var3)
    if (variable.includes('|')) {
      const fallbackChain = variable.split('|').map(v => v.trim())
      let hasValidFallback = false
      
      // Check if at least one variable in the chain has a value
      for (const fallbackVar of fallbackChain) {
        if (Object.prototype.hasOwnProperty.call(values, fallbackVar) && values[fallbackVar]) {
          hasValidFallback = true
          break
        }
      }
      
      if (!hasValidFallback) {
        missingVariables.push(variable)
      }
    } else if (!Object.prototype.hasOwnProperty.call(values, variable) || !values[variable]) {
      missingVariables.push(variable)
    }
  }

  return missingVariables
}

/**
 * Creates a sample preview of a template with mock data for all variables
 * @param template The template string containing variables
 * @param sampleValues Optional object with sample values for specific variables
 * @returns Template with variables replaced with sample values
 */
export function createTemplateSamplePreview(
  template: string, 
  sampleValues: PersonalizationData = {}
): string {
  const variables = parseTemplateVariables(template)
  const mockValues: PersonalizationData = { ...sampleValues }

  // Generate sample values for variables without provided samples
  for (const variable of variables) {
    // Skip fallback chains, we'll handle them below
    if (variable.includes('|')) continue
    
    // Only generate a mock value if not already provided
    if (!Object.prototype.hasOwnProperty.call(mockValues, variable)) {
      mockValues[variable] = `[sample ${variable}]`
    }
  }

  // Handle fallback chains by using the first variable that has a sample value
  for (const variable of variables) {
    if (variable.includes('|')) {
      const fallbackChain = variable.split('|').map(v => v.trim())
      let hasValidFallback = false
      
      // Use the first variable in the chain that has a sample value
      for (const fallbackVar of fallbackChain) {
        if (Object.prototype.hasOwnProperty.call(mockValues, fallbackVar) && mockValues[fallbackVar]) {
          hasValidFallback = true
          break
        }
      }
      
      // If none of the variables in the chain have a sample value, add one for the first variable
      if (!hasValidFallback && fallbackChain.length > 0) {
        mockValues[fallbackChain[0]] = `[sample ${fallbackChain[0]}]`
      }
    }
  }

  return applyTemplate(template, mockValues)
} 