import { LinkItem } from "../schemas/linktree";
import { prisma } from "../db/prisma";

/**
 * Generate suggestions for a user's Linktree based on their profile and platforms
 * @param userId User ID to generate suggestions for
 * @returns Array of suggested link items
 */
export async function suggestLinktreeConfig(userId: string): Promise<LinkItem[]> {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        platforms: true,
        onboardingProfile: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Start with basic suggestions
    const suggestions: LinkItem[] = [];

    // Add platform links
    if (user.platforms && user.platforms.length > 0) {
      // Map platforms to appropriate URLs
      user.platforms.forEach(platform => {
        // Handle different platform types with appropriate URLs
        if (platform.type === 'onlyfans' && platform.username) {
          suggestions.push({
            title: 'OnlyFans',
            url: `https://onlyfans.com/${platform.username}`,
          });
        } else if (platform.type === 'instagram' && platform.username) {
          suggestions.push({
            title: 'Instagram',
            url: `https://instagram.com/${platform.username}`,
          });
        } else if (platform.type === 'twitter' && platform.username) {
          suggestions.push({
            title: 'Twitter',
            url: `https://twitter.com/${platform.username}`,
          });
        } else if (platform.type === 'tiktok' && platform.username) {
          suggestions.push({
            title: 'TikTok',
            url: `https://tiktok.com/@${platform.username}`,
          });
        } else if (platform.username) {
          // Generic platform handling
          suggestions.push({
            title: platform.name || platform.type,
            url: `https://${platform.type}.com/${platform.username}`,
          });
        }
      });
    }

    // Add email contact if available
    if (user.email) {
      suggestions.push({
        title: 'Contact Me',
        url: `mailto:${user.email}`,
      });
    }

    // If no suggestions were generated, provide some defaults
    if (suggestions.length === 0) {
      suggestions.push(
        {
          title: 'My Main Account',
          url: 'https://example.com/my-account',
        },
        {
          title: 'Exclusive Content',
          url: 'https://example.com/exclusive',
        }
      );
    }

    // TODO: In a production environment, this function would use AI/LLM to:
    // 1. Analyze user data to suggest the most relevant links
    // 2. Order links by expected importance/conversion
    // 3. Generate compelling titles for links
    // 4. Suggest custom themes based on user's brand

    return suggestions;
  } catch (error) {
    console.error('Error generating Linktree suggestions:', error);
    // Return basic defaults if error occurs
    return [
      {
        title: 'My Account',
        url: 'https://example.com/account',
      },
      {
        title: 'My Content',
        url: 'https://example.com/content',
      },
    ];
  }
} 