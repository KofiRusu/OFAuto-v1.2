import { ScheduledPost } from "@/components/scheduler/create-scheduled-post-modal";
import { logger } from "@/lib/logger";

// Platform-specific content requirements
export interface PlatformRequirements {
  maxContentLength?: number;
  maxTitleLength?: number;
  maxHashtags?: number;
  supportedMediaTypes?: string[];
  specialRequirements?: string[];
  recommendedFormat?: string;
}

export const PLATFORM_REQUIREMENTS: Record<string, PlatformRequirements> = {
  twitter: {
    maxContentLength: 280,
    maxHashtags: 5,
    supportedMediaTypes: ["image", "video", "gif", "link"],
    recommendedFormat: "Short and concise with hashtags, questions, or calls to action."
  },
  facebook: {
    maxContentLength: 5000,
    supportedMediaTypes: ["image", "video", "link", "carousel"],
    recommendedFormat: "Longer form content with personal stories, questions, and engaging descriptions."
  },
  instagram: {
    maxContentLength: 2200,
    maxHashtags: 30,
    supportedMediaTypes: ["image", "video", "carousel"],
    recommendedFormat: "Visual-focused with emotive descriptions and many hashtags in comments."
  },
  linkedin: {
    maxContentLength: 3000,
    supportedMediaTypes: ["image", "video", "document", "link"],
    recommendedFormat: "Professional tone with industry insights, career advice, or company updates."
  },
  youtube: {
    maxTitleLength: 100,
    maxContentLength: 5000, // Description
    supportedMediaTypes: ["video"],
    specialRequirements: ["Video file required", "Thumbnail recommended"],
    recommendedFormat: "SEO-optimized title and description with timestamps, links, and clear CTAs."
  },
  tiktok: {
    maxContentLength: 2200,
    supportedMediaTypes: ["video"],
    specialRequirements: ["Video required (15-60s optimal)"],
    recommendedFormat: "Trendy, attention-grabbing captions with relevant hashtags."
  },
  reddit: {
    maxTitleLength: 300,
    maxContentLength: 40000,
    supportedMediaTypes: ["text", "image", "video", "link", "poll"],
    specialRequirements: ["Subreddit rules must be followed"],
    recommendedFormat: "Conversational, question-based titles and detailed descriptions with formatting."
  },
  threads: {
    maxContentLength: 500,
    supportedMediaTypes: ["text", "image", "video", "link"],
    recommendedFormat: "Conversational tone with questions or hot takes to encourage replies."
  },
  pinterest: {
    maxTitleLength: 100,
    maxContentLength: 500, // Description
    supportedMediaTypes: ["image"],
    specialRequirements: ["Image required", "Board categorization"],
    recommendedFormat: "Descriptive title with keywords and actionable description."
  }
};

// Content persona types
export interface ContentPersona {
  id: string;
  name: string;
  tone: string;
  style: string;
  vocabulary: string;
  specialCharacteristics?: string[];
}

// Mock personas for demo purposes
export const SAMPLE_PERSONAS: ContentPersona[] = [
  {
    id: "professional",
    name: "Professional Expert",
    tone: "Authoritative, confident, educational",
    style: "Informative with data-backed statements",
    vocabulary: "Industry-specific terminology, formal language"
  },
  {
    id: "casual",
    name: "Casual Friend",
    tone: "Friendly, approachable, conversational",
    style: "Personal stories, questions, casual observations",
    vocabulary: "Everyday language, occasional slang, emojis"
  },
  {
    id: "motivational",
    name: "Motivational Coach",
    tone: "Inspiring, energetic, positive",
    style: "Action-oriented with powerful statements",
    vocabulary: "Empowering language, metaphors, calls to action"
  },
  {
    id: "humorous",
    name: "Humor & Entertainment",
    tone: "Witty, light-hearted, playful",
    style: "Jokes, puns, amusing observations",
    vocabulary: "Playful language, pop culture references, surprises"
  }
];

export class ReasoningService {
  /**
   * Generate platform-specific content variants based on a source post
   */
  async generatePlatformVariants(
    post: ScheduledPost,
    targetPlatforms: string[],
    persona?: ContentPersona
  ): Promise<ScheduledPost[]> {
    logger.info(`Generating content variants for ${targetPlatforms.join(", ")}`);
    const variants: ScheduledPost[] = [];
    
    for (const platform of targetPlatforms) {
      try {
        const variant = await this.generateVariantForPlatform(post, platform, persona);
        variants.push(variant);
        logger.info(`Generated variant for ${platform}`);
      } catch (error) {
        logger.error(`Error generating variant for ${platform}: ${error}`);
      }
    }
    
    return variants;
  }
  
  /**
   * Generate a content variant for a specific platform
   */
  private async generateVariantForPlatform(
    post: ScheduledPost,
    platform: string,
    persona?: ContentPersona
  ): Promise<ScheduledPost> {
    const requirements = PLATFORM_REQUIREMENTS[platform] || {};
    
    // In a real implementation, this would call an AI service (e.g., OpenAI)
    // to generate the platform-specific content
    
    // Create a new post object with the same base data
    const variant: ScheduledPost = {
      ...post,
      id: `${post.id}-${platform}`,
      platform,
      platforms: post.platforms // Keep the multi-platform context
    };
    
    // Apply platform-specific transformations (mock for scaffolding)
    switch (platform) {
      case "twitter":
        variant.content = this.truncateContent(post.content, 280);
        variant.content = this.addTwitterHashtags(variant.content);
        break;
        
      case "youtube":
        variant.title = `${post.title} | Complete Guide ${new Date().getFullYear()}`;
        variant.content = this.generateYouTubeDescription(post.content);
        break;
        
      case "tiktok":
        variant.content = this.truncateContent(post.content, 150);
        variant.content = this.addTikTokTrending(variant.content);
        break;
        
      case "reddit":
        variant.title = this.generateRedditTitle(post.title);
        variant.content = this.formatRedditContent(post.content);
        break;
        
      case "threads":
        variant.content = this.truncateContent(post.content, 500);
        // Make more conversational
        if (!variant.content.includes("?")) {
          variant.content += "\n\nWhat do you think?";
        }
        break;
        
      case "pinterest":
        variant.title = this.generatePinterestTitle(post.title);
        variant.content = this.truncateContent(post.content, 500);
        // Add SEO elements
        variant.content = `📌 ${variant.content}\n\n#inspiration #ideas`;
        break;
        
      default:
        // For other platforms, keep content as is or apply basic formatting
        break;
    }
    
    // Apply persona-specific adjustments if a persona is provided
    if (persona) {
      variant.title = this.applyPersona(variant.title, persona);
      variant.content = this.applyPersona(variant.content, persona);
    }
    
    return variant;
  }
  
  /**
   * Helper methods for content transformation
   */
  
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    // Find a good breaking point
    const breakPoint = content.lastIndexOf(".", maxLength - 3);
    if (breakPoint > maxLength * 0.5) {
      return content.substring(0, breakPoint + 1);
    }
    
    // If no good sentence break, just truncate with ellipsis
    return content.substring(0, maxLength - 3) + "...";
  }
  
  private addTwitterHashtags(content: string): string {
    // Extract keywords and add hashtags (mock implementation)
    const keywords = ["social", "media", "marketing"];
    const randomHashtags = keywords
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(k => `#${k}`);
    
    return `${content}\n\n${randomHashtags.join(" ")}`;
  }
  
  private generateYouTubeDescription(content: string): string {
    // Create a YouTube style description with timestamps and links
    return `${content}\n\n⏱️ TIMESTAMPS:\n00:00 Introduction\n01:23 Key Points\n04:56 Summary\n\n🔗 LINKS:\nWebsite: https://example.com\nFollow us: @examplehandle\n\n#video #tutorial`;
  }
  
  private addTikTokTrending(content: string): string {
    // Add TikTok-style trending hashtags
    return `${content}\n\n#fyp #foryoupage #viral #trending`;
  }
  
  private generateRedditTitle(title: string): string {
    // Make title more engaging for Reddit
    const redditPrefixes = [
      "Just discovered: ",
      "What do you think about ",
      "Interesting take on ",
      "Discussion: "
    ];
    const prefix = redditPrefixes[Math.floor(Math.random() * redditPrefixes.length)];
    return `${prefix}${title}?`;
  }
  
  private formatRedditContent(content: string): string {
    // Format content in Reddit markdown style
    const paragraphs = content.split("\n").filter(p => p.trim());
    
    if (paragraphs.length <= 1) {
      return `**TL;DR:** ${content}\n\n---\n\n${content}\n\nWhat are your thoughts on this? I'd love to hear your perspective.`;
    }
    
    const tldr = paragraphs[0];
    const body = paragraphs.join("\n\n");
    
    return `**TL;DR:** ${tldr}\n\n---\n\n${body}\n\nWhat are your thoughts on this? I'd love to hear your perspective.`;
  }
  
  private generatePinterestTitle(title: string): string {
    // Make title more Pinterest-friendly
    const pinterestPrefixes = [
      "How to: ",
      "DIY: ",
      "10 ways to ",
      "Ultimate guide to "
    ];
    const prefix = pinterestPrefixes[Math.floor(Math.random() * pinterestPrefixes.length)];
    return `${prefix}${title}`;
  }
  
  private applyPersona(text: string, persona: ContentPersona): string {
    // In a real implementation, this would use AI to rewrite the content
    // according to the persona's tone, style, and vocabulary
    
    // Simple mock implementation for scaffolding
    switch (persona.id) {
      case "professional":
        return `${text}\n\n[Written in a professional, authoritative tone]`;
      case "casual":
        return `${text}\n\n[Written in a casual, friendly tone]`;
      case "motivational":
        return `${text}\n\n[Written in a motivational, inspiring tone]`;
      case "humorous":
        return `${text}\n\n[Written in a humorous, witty tone]`;
      default:
        return text;
    }
  }
} 