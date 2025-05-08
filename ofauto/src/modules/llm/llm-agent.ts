import axios from 'axios';
import { prisma } from '@/lib/db/prisma';

/**
 * LLM Provider enum
 */
export enum LLMProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
}

/**
 * LLM Model interface
 */
export interface LLMModel {
  provider: LLMProvider;
  modelName: string;
  maxTokens: number;
  costPer1KTokens: number;
  capabilities: string[];
}

/**
 * Message interface for chat conversations
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Agent configuration
 */
export interface LLMAgentConfig {
  provider: LLMProvider;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * LLM Agent class for managing interactions with language models
 */
export class LLMAgent {
  private config: LLMAgentConfig;
  private apiKey: string | null = null;
  private availableModels: LLMModel[] = [
    {
      provider: LLMProvider.OPENAI,
      modelName: 'gpt-4o',
      maxTokens: 128000,
      costPer1KTokens: 0.01,
      capabilities: ['text', 'code', 'reasoning', 'planning'],
    },
    {
      provider: LLMProvider.ANTHROPIC,
      modelName: 'claude-3-opus',
      maxTokens: 200000,
      costPer1KTokens: 0.015,
      capabilities: ['text', 'code', 'reasoning', 'planning'],
    },
  ];

  constructor(config: LLMAgentConfig) {
    this.config = {
      ...config,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
    };

    this.loadApiKey(config.provider);
  }

  /**
   * Load API key for the provider
   */
  private loadApiKey(provider: LLMProvider) {
    switch (provider) {
      case LLMProvider.OPENAI:
        this.apiKey = process.env.OPENAI_API_KEY || null;
        break;
      case LLMProvider.ANTHROPIC:
        this.apiKey = process.env.ANTHROPIC_API_KEY || null;
        break;
    }

    if (!this.apiKey) {
      console.warn(`No API key found for ${provider}`);
    }
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant for a social media management platform focused on OnlyFans and similar platforms. 
Your goal is to help content creators maximize engagement, earnings, and growth.
Be conversational, helpful, and provide data-backed suggestions when possible.
Always prioritize revenue optimization and audience growth in your recommendations.`;
  }

  /**
   * Generate text completion
   */
  async complete(prompt: string): Promise<string> {
    const messages: Message[] = [
      { role: 'system', content: this.config.systemPrompt || '' },
      { role: 'user', content: prompt },
    ];

    return this.chat(messages);
  }

  /**
   * Generate chat completion from a series of messages
   */
  async chat(messages: Message[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error(`No API key available for ${this.config.provider}`);
    }

    try {
      switch (this.config.provider) {
        case LLMProvider.OPENAI:
          return await this.callOpenAI(messages);
        case LLMProvider.ANTHROPIC:
          return await this.callAnthropic(messages);
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error: any) {
      console.error('LLM API call failed:', error);
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.modelName,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(messages: Message[]): Promise<string> {
    // Convert messages to Anthropic format
    const formattedMessages = messages.map(message => ({
      role: message.role === 'assistant' ? 'assistant' : message.role === 'system' ? 'system' : 'user',
      content: message.content,
    }));

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.modelName,
        messages: formattedMessages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Generate a response to a direct message
   */
  async generateDMResponse(
    message: string,
    context: {
      previousMessages: { sender: string; message: string; timestamp: Date }[];
      clientInfo: any;
      platformData: any;
    }
  ): Promise<string> {
    // Build prompt with context
    const prompt = `
Generate a personalized response to this direct message on OnlyFans:

## Incoming Message
${message}

## Previous Conversation
${context.previousMessages
  .map(m => `${m.sender}: ${m.message} [${m.timestamp.toISOString()}]`)
  .join('\n')}

## Client Info
${JSON.stringify(context.clientInfo, null, 2)}

## Platform Data
${JSON.stringify(context.platformData, null, 2)}

## Guidelines
- Be conversational and engaging
- Keep responses relatively short (1-3 sentences)
- Encourage engagement and spending when appropriate
- Never sound automated or robotic
- Match the tone and style of previous responses
- Use emojis sparingly if the client has used them

Response:`;

    return this.complete(prompt);
  }

  /**
   * Generate a comment reply
   */
  async generateCommentReply(
    comment: string,
    context: {
      contentInfo: any;
      commentAuthor: string;
      isSubscriber: boolean;
    }
  ): Promise<string> {
    const prompt = `
Generate a personalized reply to this comment on an OnlyFans post:

## Comment
${comment} (by ${context.commentAuthor}, ${context.isSubscriber ? 'Subscriber' : 'Non-subscriber'})

## Content Info
${JSON.stringify(context.contentInfo, null, 2)}

## Guidelines
- Be conversational and engaging
- Keep responses short (1-2 sentences)
- Thank subscribers for their support
- Encourage non-subscribers to subscribe when appropriate
- Use emojis if they fit the tone
- Match the content creator's typical comment style

Reply:`;

    return this.complete(prompt);
  }

  /**
   * Generate content suggestions
   */
  async generateContentSuggestions(
    clientId: string,
    context: {
      recentPerformance: any;
      audiencePreferences: any;
      topPerforming: any;
    }
  ): Promise<{
    suggestions: { type: string; title: string; description: string; reasoning: string }[];
    strategy: string;
  }> {
    // Build a detailed prompt with performance data
    const prompt = `
Generate content suggestions for an OnlyFans creator based on their performance data:

## Recent Performance
${JSON.stringify(context.recentPerformance, null, 2)}

## Audience Preferences
${JSON.stringify(context.audiencePreferences, null, 2)}

## Top Performing Content
${JSON.stringify(context.topPerforming, null, 2)}

Please provide 5 specific content suggestions with the following for each:
1. Content type
2. Suggested title
3. Brief description of the content
4. Strategic reasoning for this suggestion based on the data

Also include an overall content strategy recommendation based on the data.

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "type": "Content type (e.g., Photo, Video, Text, Story)",
      "title": "Suggested title",
      "description": "Brief content description",
      "reasoning": "Data-backed reasoning"
    },
    // More suggestions...
  ],
  "strategy": "Overall content strategy recommendation"
}`;

    const completion = await this.complete(prompt);
    try {
      // Parse the JSON response
      return JSON.parse(completion);
    } catch (error) {
      console.error('Failed to parse JSON from LLM response:', error);
      
      // Fallback response
      return {
        suggestions: [
          {
            type: 'Photo',
            title: 'Suggested content',
            description: 'This is a suggested content item',
            reasoning: 'Based on platform trends',
          }
        ],
        strategy: 'Continue with current content strategy while testing new formats.',
      };
    }
  }

  /**
   * Generate a revenue optimization strategy
   */
  async generateRevenueStrategy(
    clientId: string,
    context: {
      financialMetrics: any;
      subscriberData: any;
      contentPerformance: any;
      marketingData: any;
    }
  ): Promise<{
    pricingRecommendations: any;
    contentRecommendations: any;
    marketingRecommendations: any;
    expectedOutcomes: any;
  }> {
    // Build a detailed prompt with context data
    const prompt = `
Generate a comprehensive revenue optimization strategy for an OnlyFans creator:

## Financial Metrics
${JSON.stringify(context.financialMetrics, null, 2)}

## Subscriber Data
${JSON.stringify(context.subscriberData, null, 2)}

## Content Performance
${JSON.stringify(context.contentPerformance, null, 2)}

## Marketing Data
${JSON.stringify(context.marketingData, null, 2)}

Please provide detailed recommendations for optimizing revenue across these areas:
1. Pricing strategy (subscription, PPV, tips)
2. Content strategy to maximize spend
3. Marketing approach to increase conversion
4. Expected outcomes with the strategy

Format your response as JSON with this structure:
{
  "pricingRecommendations": {
    "subscriptionPrice": {
      "current": 0,
      "recommended": 0,
      "reasoning": ""
    },
    "ppvStrategy": "",
    "tippingStrategy": ""
  },
  "contentRecommendations": {
    "contentMix": "",
    "postingFrequency": "",
    "highValueContent": []
  },
  "marketingRecommendations": {
    "platformFocus": [],
    "messagingStrategy": "",
    "targetAudience": "",
    "budgetAllocation": {}
  },
  "expectedOutcomes": {
    "revenueIncrease": "",
    "subscriberGrowth": "",
    "retentionImprovement": "",
    "timeframe": ""
  }
}`;

    const completion = await this.complete(prompt);
    try {
      // Parse the JSON response
      return JSON.parse(completion);
    } catch (error) {
      console.error('Failed to parse JSON from LLM response:', error);
      
      // Fallback response
      return {
        pricingRecommendations: {
          subscriptionPrice: {
            current: 9.99,
            recommended: 12.99,
            reasoning: "Based on content quality and market positioning"
          },
          ppvStrategy: "Implement premium PPV content once weekly",
          tippingStrategy: "Add tip menus to all posts"
        },
        contentRecommendations: {
          contentMix: "60% photos, 30% videos, 10% text",
          postingFrequency: "1-2 posts daily",
          highValueContent: ["Themed photosets", "2-5 minute videos"]
        },
        marketingRecommendations: {
          platformFocus: ["TikTok", "Twitter"],
          messagingStrategy: "Tease exclusive content",
          targetAudience: "Males 25-40",
          budgetAllocation: { "TikTok": "60%", "Twitter": "40%" }
        },
        expectedOutcomes: {
          revenueIncrease: "15-25%",
          subscriberGrowth: "10-15%",
          retentionImprovement: "5-10%",
          timeframe: "30-60 days"
        }
      };
    }
  }

  /**
   * Save a prompt template
   */
  async savePromptTemplate(
    name: string,
    template: string,
    category: string
  ): Promise<boolean> {
    try {
      await prisma.aIPromptTemplate.create({
        data: {
          name,
          promptTemplate: template,
          category: category as any,
        },
      });
      return true;
    } catch (error) {
      console.error('Error saving prompt template:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): LLMModel[] {
    return this.availableModels;
  }
} 