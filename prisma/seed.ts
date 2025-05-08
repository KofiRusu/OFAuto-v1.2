const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');
  
  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      clerkId: 'test_admin_clerk_id',
      role: UserRole.ADMIN,
    },
  });
  
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      name: 'Manager User',
      clerkId: 'test_manager_clerk_id',
      role: UserRole.MANAGER,
    },
  });
  
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'Regular User',
      clerkId: 'test_user_clerk_id',
      role: UserRole.USER,
    },
  });
  
  console.log(`Created users: ${adminUser.name}, ${managerUser.name}, ${regularUser.name}`);
  
  // Create test platforms
  const twitterPlatform = await prisma.platform.upsert({
    where: { id: 'twitter-test' },
    update: {},
    create: {
      id: 'twitter-test',
      type: 'TWITTER',
      name: 'Twitter Test',
      userId: regularUser.id,
      status: 'ACTIVE',
      lastCheckedAt: new Date(),
      credentials: {
        create: {
          accessToken: 'mock_access_token',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      }
    },
  });
  
  const instagramPlatform = await prisma.platform.upsert({
    where: { id: 'instagram-test' },
    update: {},
    create: {
      id: 'instagram-test',
      type: 'INSTAGRAM',
      name: 'Instagram Test',
      userId: regularUser.id,
      status: 'ACTIVE',
      lastCheckedAt: new Date(),
      credentials: {
        create: {
          accessToken: 'mock_access_token',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      }
    },
  });
  
  const onlyfansPlatform = await prisma.platform.upsert({
    where: { id: 'onlyfans-test' },
    update: {},
    create: {
      id: 'onlyfans-test',
      type: 'ONLYFANS',
      name: 'OnlyFans Test',
      userId: regularUser.id,
      status: 'ACTIVE',
      lastCheckedAt: new Date(),
      credentials: {
        create: {
          accessToken: 'mock_access_token',
          // No expiration for OnlyFans
        }
      }
    },
  });
  
  console.log('Created test platforms: Twitter, Instagram, OnlyFans');
  
  // Create test scheduled posts
  const scheduledPost = await prisma.scheduledPost.upsert({
    where: { id: 'test-post-1' },
    update: {},
    create: {
      id: 'test-post-1',
      title: 'Test Scheduled Post',
      content: 'This is a test scheduled post content.',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'SCHEDULED',
      clientId: null,
      createdById: regularUser.id,
      mediaUrls: [],
      tags: ['test', 'automation'],
      platforms: {
        create: [
          { platformId: twitterPlatform.id },
          { platformId: instagramPlatform.id }
        ]
      }
    }
  });
  
  console.log('Created test scheduled post');
  
  // Create test campaign experiment
  const experiment = await prisma.campaignExperiment.upsert({
    where: { id: 'test-experiment-1' },
    update: {},
    create: {
      id: 'test-experiment-1',
      name: 'Test A/B Experiment',
      description: 'Testing different content styles',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: 'ACTIVE',
      createdById: regularUser.id,
      variantA: {
        title: 'Casual Style',
        content: 'Hey everyone! Check out my latest content!'
      },
      variantB: {
        title: 'Professional Style',
        content: "I'm excited to share my latest professional work with you all."
      },
      metrics: {
        variantA: {
          engagementRate: 12.5,
          clicks: 45,
          impressions: 360
        },
        variantB: {
          engagementRate: 15.8,
          clicks: 62,
          impressions: 392
        }
      }
    }
  });
  
  console.log('Created test experiment');
  
  // Create test client persona
  const persona = await prisma.clientPersona.upsert({
    where: { id: 'test-persona-1' },
    update: {},
    create: {
      id: 'test-persona-1',
      name: 'Test Persona',
      description: 'A test persona for development',
      brandVoice: 'casual',
      contentStyles: ['educational', 'humorous'],
      useForAutomation: true,
      createdById: regularUser.id
    }
  });
  
  console.log('Created test client persona');

  // Create test chatbot persona
  const chatbotPersona = await prisma.chatbotPersona.upsert({
    where: { id: 'test-chatbot-1' },
    update: {},
    create: {
      id: 'test-chatbot-1',
      name: 'Content Assistant',
      description: 'Helps generate engaging social media content',
      instructions: 'You are a helpful content creation assistant that helps creators write engaging posts.',
      isGlobal: true,
      createdById: adminUser.id
    }
  });

  console.log('Created test chatbot persona');

  // Create test feedback
  const feedback = await prisma.chatbotMessageFeedback.create({
    data: {
      personaId: chatbotPersona.id,
      userId: regularUser.id,
      rating: 5,
      comment: 'Very helpful suggestions!',
      messageText: 'I need ideas for a post about my new photoshoot.',
      responseText: 'You could share a behind-the-scenes look at your photoshoot process, highlighting the creative aspects that your followers might not usually see.'
    }
  });

  console.log('Created test feedback');

  // Create test engagement metric
  const engagementMetric = await prisma.engagementMetric.create({
    data: {
      platformId: twitterPlatform.id,
      clientId: regularUser.id,
      metricType: 'likes',
      metricValue: 245.0,
      timeframe: 'weekly',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    }
  });

  console.log('Created test engagement metric');
  
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 