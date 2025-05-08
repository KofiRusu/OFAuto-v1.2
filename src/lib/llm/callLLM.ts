/**
 * Handles calling an LLM (Large Language Model) API
 * Supports OpenAI and Anthropic APIs
 */

interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Call an LLM with a prompt
 * @param prompt The prompt to send to the LLM
 * @returns The LLM's response
 */
export async function callLLM(prompt: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4';
  
  if (!apiKey) {
    console.warn('No LLM API key found. Using mock response for development.');
    return getMockResponse(prompt);
  }
  
  try {
    console.log(`Calling ${provider} with model ${model}`);
    
    let response: LLMResponse;
    
    switch (provider.toLowerCase()) {
      case 'openai':
        response = await callOpenAI(prompt, apiKey, model);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, apiKey, model);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
    
    logResponse(prompt, response);
    return response.content;
  } catch (error) {
    console.error('Error calling LLM:', error);
    return getMockResponse(prompt);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert content creator monetization advisor that provides insights based on analytics data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<LLMResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: 'You are an expert content creator monetization advisor that provides insights based on analytics data.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    content: data.content[0].text,
    model: data.model,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

/**
 * Log the response for debugging
 */
function logResponse(prompt: string, response: LLMResponse): void {
  console.log('LLM Response:', {
    model: response.model,
    usage: response.usage,
    contentPreview: response.content.substring(0, 100) + '...',
  });
}

/**
 * Get a mock response for development/testing
 */
function getMockResponse(prompt: string): string {
  // Return a mock insight response
  return `[
    {
      "title": "Optimize Subscription Tiers",
      "description": "Your subscription revenue shows potential for growth. Consider adding a mid-tier subscription option to capture users who find your current pricing too high or too low.",
      "actionLabel": "Adjust Pricing Tiers",
      "actionType": "adjust_price",
      "recommendedValue": "Add a $9.99 mid-tier option",
      "importance": 5,
      "category": "revenue"
    },
    {
      "title": "Cross-Platform Content Strategy",
      "description": "Your engagement is 42% higher on platforms where you post at least 3x weekly. Increasing posting frequency on lower-performing platforms could drive significant follower growth.",
      "actionLabel": "Schedule More Posts",
      "actionType": "schedule_post",
      "importance": 4,
      "category": "engagement"
    },
    {
      "title": "Leverage Trending Topics",
      "description": "Current trending topics in your niche include seasonal content. Creating timely content around these trends could boost visibility and follower acquisition.",
      "actionLabel": "Create Seasonal Content",
      "actionType": "schedule_post",
      "importance": 3,
      "category": "growth"
    }
  ]`;
} 