import { PlatformType, SpecificStrategy, StrategyType } from "../types";
import { strategyPrompt, defaultMetricsTemplate } from './default';

// Simplified export
export { 
  strategyPrompt,
  defaultMetricsTemplate
};

// Simple function that always returns the default prompt
export function getPromptTemplate(
  platformType: PlatformType,
  strategyType?: StrategyType,
  specificStrategy?: SpecificStrategy
): string {
  return strategyPrompt;
} 