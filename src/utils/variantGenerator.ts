import { ScheduledPost } from "@/components/scheduler/create-scheduled-post-modal";
import { ReasoningService, ContentPersona } from "@/services/reasoningService";
import { logger } from "@/lib/logger";

/**
 * Utility that generates platform-specific variants of content
 * This is the high-level interface for the ReasoningService
 */
export class VariantGenerator {
  private reasoningService: ReasoningService;
  
  constructor() {
    this.reasoningService = new ReasoningService();
  }
  
  /**
   * Generate platform-specific variants of a post
   * @param post The source post to generate variants from
   * @param platforms Target platforms to generate variants for
   * @param persona Optional content persona to apply
   * @returns Array of platform-specific post variants
   */
  async generatePlatformVariants(
    post: ScheduledPost,
    platforms: string[],
    persona?: ContentPersona
  ): Promise<ScheduledPost[]> {
    logger.info(`Generating variants for post "${post.title}" for ${platforms.length} platforms`);
    
    try {
      // Generate variants using the reasoning service
      const variants = await this.reasoningService.generatePlatformVariants(
        post,
        platforms,
        persona
      );
      
      logger.info(`Successfully generated ${variants.length} variants`);
      return variants;
    } catch (error) {
      logger.error(`Error generating variants: ${error}`);
      
      // Fallback: create basic variants without AI optimization
      return this.createBasicVariants(post, platforms);
    }
  }
  
  /**
   * Create simple variants without AI optimization (fallback method)
   */
  private createBasicVariants(post: ScheduledPost, platforms: string[]): ScheduledPost[] {
    return platforms.map(platform => ({
      ...post,
      id: `${post.id}-${platform}`,
      platform,
      platforms: post.platforms // Maintain multi-platform context
    }));
  }
  
  /**
   * Generate A/B test variants for experiments
   * @param post The source post
   * @param variantCount Number of variants to generate (default: 2)
   * @returns Array of variant posts
   */
  async generateABTestVariants(
    post: ScheduledPost,
    variantCount: number = 2
  ): Promise<ScheduledPost[]> {
    logger.info(`Generating ${variantCount} A/B test variants for post "${post.title}"`);
    
    const variants: ScheduledPost[] = [];
    
    // In a real implementation, this would use AI to generate meaningfully different
    // variants for A/B testing (e.g., different headlines, content lengths, tones)
    
    // Mock implementation for scaffolding
    for (let i = 0; i < variantCount; i++) {
      variants.push({
        ...post,
        id: `${post.id}-variant-${i + 1}`,
        title: i === 0 ? post.title : `${post.title} (Alternative ${i})`,
        content: i === 0 ? post.content : this.generateAlternativeContent(post.content, i)
      });
    }
    
    return variants;
  }
  
  /**
   * Generate alternative content for A/B testing (mock implementation)
   */
  private generateAlternativeContent(content: string, variant: number): string {
    // Simple mock implementation for scaffolding
    const variations = [
      // Variant 1: More concise
      content.split(".").slice(0, 2).join(".") + ".",
      
      // Variant 2: More questions
      `${content}\n\nWhat do you think about this? Have you tried it before?`,
      
      // Variant 3: Call to action
      `${content}\n\nTry it today and let us know your results in the comments!`
    ];
    
    return variations[variant - 1] || content;
  }
} 