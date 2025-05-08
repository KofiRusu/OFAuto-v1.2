/**
 * Seed Script for OFAuto
 * 
 * This script populates the database with realistic demo data
 * to showcase the application's features without requiring
 * real platform connections.
 * 
 * Usage:
 * npm run seed
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_USER_ID = 'demo-user-001';
const DEMO_USER_EMAIL = 'demo@ofauto.app';
const DEFAULT_CLERK_ID = 'user_2NVZjAQZWzlR6EjZW8R6mLvZ5KO'; // Demo Clerk ID, can be replaced with your actual demo user

// Supported platforms
const PLATFORMS = ['onlyfans', 'fansly', 'patreon', 'kofi', 'instagram', 'twitter'];

// Persona data
const PERSONAS = [
  {
    id: 'persona-001',
    name: 'Flirty & Playful',
    description: 'Flirtatious and fun communication style',
    systemPrompt: 'You are a flirty and playful creator who uses lots of emojis and expressive language.',
    isDefault: true,
  },
  {
    id: 'persona-002',
    name: 'Dominant & Assertive',
    description: 'Strong and commanding communication style',
    systemPrompt: 'You are a dominant and confident creator who uses direct language and commanding tone.',
    isDefault: false,
  },
  {
    id: 'persona-003',
    name: 'Sweet & Caring',
    description: 'Warm and supportive communication style',
    systemPrompt: 'You are a sweet and caring creator who uses nurturing language and shows genuine concern.',
    isDefault: false,
  }
];

// Function to create random dates within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to create a random platform
function randomPlatform(): string {
  return PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
}

// Function to create a random persona
function randomPersona(): string {
  return PERSONAS[Math.floor(Math.random() * PERSONAS.length)].id;
}

// Function to create a random Auto-DM status
function randomDMStatus(): string {
  const statuses = ['sent', 'pending', 'failed', 'manual'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Function to generate analyticsPoints data
function generateAnalyticsPoints(dayCount: number = 30) {
  const today = new Date();
  const points = [];

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseFollowers = 1000 - i * 5 + Math.floor(Math.random() * 20 - 10); // Decreasing with small variation
    const baseRevenue = 100 - i * 0.5 + Math.random() * 10 - 5; // Decreasing with small variation

    points.push({
      id: uuidv4(),
      date: date.toISOString(),
      platform: i % 3 === 0 ? 'onlyfans' : i % 3 === 1 ? 'fansly' : 'patreon',
      totalFollowers: baseFollowers,
      totalRevenue: baseRevenue,
      engagementRate: 5 + Math.random() * 2,
      totalEngagement: Math.floor(baseFollowers * 0.1), // 10% engagement
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return points;
}

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    // Clean existing demo data
    console.log('Cleaning existing demo data...');
    await prisma.message.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.follower.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.post.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.analyticsPoint.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.automationTask.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.persona.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.integration.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.alert.deleteMany({ where: { userId: DEMO_USER_ID } });
    await prisma.user.deleteMany({ where: { id: DEMO_USER_ID } });
    
    // Create demo user
    console.log('Creating demo user...');
    const demoUser = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        name: 'Demo User',
        clerkId: DEFAULT_CLERK_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create personas
    console.log('Creating personas...');
    for (const persona of PERSONAS) {
      await prisma.persona.create({
        data: {
          id: persona.id,
          name: persona.name,
          description: persona.description,
          systemPrompt: persona.systemPrompt,
          isDefault: persona.isDefault,
          userId: demoUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Create integrations (2 connected, rest disconnected)
    console.log('Creating integrations...');
    for (const platform of PLATFORMS) {
      await prisma.integration.create({
        data: {
          id: `integration-${platform}`,
          platform,
          userId: demoUser.id,
          status: platform === 'onlyfans' || platform === 'fansly' ? 'active' : 'inactive',
          username: platform === 'onlyfans' ? 'demofans' : platform === 'fansly' ? 'demofansly' : null,
          accessToken: platform === 'onlyfans' || platform === 'fansly' ? 'demo-token' : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Create followers
    console.log('Creating followers...');
    for (let i = 0; i < 50; i++) {
      const platform = randomPlatform();
      const followedAt = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const personaId = randomPersona();
      const dmStatus = randomDMStatus();

      await prisma.follower.create({
        data: {
          id: `follower-${i}`,
          userId: demoUser.id,
          platform,
          name: faker.person.fullName(),
          username: faker.internet.userName(),
          followedAt,
          autoDMStatus: dmStatus,
          personaUsed: dmStatus === 'sent' ? personaId : null,
          bio: faker.lorem.sentence(),
          location: faker.location.city(),
          subscribedSince: followedAt,
          spentAmount: Math.round(Math.random() * 1000) / 10,
          engagementRate: Math.round(Math.random() * 100) / 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Create messages (for the first 20 followers)
    console.log('Creating messages...');
    const followers = await prisma.follower.findMany({
      where: { userId: demoUser.id },
      take: 20,
    });

    for (const follower of followers) {
      const messageCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < messageCount; i++) {
        const isSystem = i % 2 === 0; // Alternate between system and user messages

        await prisma.message.create({
          data: {
            id: `message-${follower.id}-${i}`,
            userId: demoUser.id,
            followerId: follower.id,
            platform: follower.platform,
            from: isSystem ? 'system' : 'user',
            text: isSystem 
              ? faker.helpers.arrayElement([
                  "Hey there! Thanks for subscribing 💖 Let me know if there's anything specific you'd like to see!",
                  "Welcome to my exclusive content! I'm so excited to share more with you 🔥",
                  "Thanks for the support! I have some amazing new content planned this week, stay tuned 😉",
                  "Hi there! Just wanted to check in and see how you're enjoying the content so far?",
                  "Welcome aboard! I'd love to know more about what kind of content you enjoy most!"
                ])
              : faker.helpers.arrayElement([
                  "Your content is amazing! Can't wait to see more",
                  "Thanks for reaching out! I'm loving everything so far",
                  "Just subscribed and already obsessed with your content",
                  "Will you be posting more videos like the one yesterday?",
                  "You're my favorite creator by far!"
                ]),
            personaUsed: isSystem ? randomPersona() : null,
            deliveryStatus: 'sent',
            createdAt: randomDate(follower.followedAt, new Date()),
            updatedAt: new Date(),
          },
        });
      }
    }

    // Create scheduled posts
    console.log('Creating scheduled posts...');
    for (let i = 0; i < 10; i++) {
      const platform = randomPlatform();
      const isScheduled = i < 6; // First 6 are scheduled, rest are drafts
      const scheduledFor = isScheduled 
        ? randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) 
        : null;

      await prisma.post.create({
        data: {
          id: `post-${i}`,
          userId: demoUser.id,
          platform,
          caption: faker.lorem.paragraph(),
          mediaUrl: faker.image.url(),
          status: isScheduled ? 'scheduled' : 'draft',
          scheduledFor,
          isPpv: i % 3 === 0,
          ppvPrice: i % 3 === 0 ? Math.round(Math.random() * 200) / 10 + 5 : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Create automation tasks
    console.log('Creating automation tasks...');
    const taskStatuses = ['queued', 'running', 'completed', 'failed'];
    const taskTypes = ['post', 'message', 'pricingUpdate', 'follow', 'analyze'];
    
    for (let i = 0; i < 10; i++) {
      const platform = randomPlatform();
      const status = taskStatuses[Math.min(i, taskStatuses.length - 1)];
      const type = taskTypes[i % taskTypes.length];
      const createdAt = new Date(Date.now() - i * 60 * 60 * 1000);
      const executedAt = status === 'completed' || status === 'failed' 
        ? new Date(createdAt.getTime() + 15 * 60 * 1000) 
        : null;
      
      await prisma.automationTask.create({
        data: {
          id: `task-${i}`,
          userId: demoUser.id,
          platform,
          status,
          type,
          personaUsed: type === 'message' ? randomPersona() : null,
          payload: JSON.stringify({
            message: type === 'message' ? faker.lorem.sentence() : null,
            caption: type === 'post' ? faker.lorem.paragraph() : null,
            price: type === 'pricingUpdate' ? Math.round(Math.random() * 1000) / 10 + 5 : null,
          }),
          errorLog: status === 'failed' ? faker.helpers.arrayElement([
            "API rate limit exceeded",
            "Authentication token expired",
            "Platform temporarily unavailable",
            "Invalid media format"
          ]) : null,
          createdAt,
          executedAt,
          updatedAt: new Date(),
        },
      });
    }

    // Create analytics data
    console.log('Creating analytics data...');
    const analyticsPoints = generateAnalyticsPoints(30);
    
    for (const point of analyticsPoints) {
      await prisma.analyticsPoint.create({
        data: {
          ...point,
          userId: demoUser.id,
        },
      });
    }

    // Create alerts
    console.log('Creating alerts...');
    const alertTypes = [
      { metric: 'engagement_rate', condition: 'drops_below', threshold: 5, timeframe: 'last_day' },
      { metric: 'earnings_daily', condition: 'increases_above', threshold: 100, timeframe: 'last_day' },
      { metric: 'follower_count', condition: 'drops_below', threshold: 950, timeframe: 'last_week' },
      { metric: 'api_errors', condition: 'increases_above', threshold: 10, timeframe: 'last_hour' },
    ];
    
    for (let i = 0; i < alertTypes.length; i++) {
      const alert = alertTypes[i];
      const platform = i === 0 ? 'onlyfans' : i === 1 ? 'fansly' : i === 2 ? 'all' : 'instagram';
      
      await prisma.alert.create({
        data: {
          id: `alert-${i}`,
          userId: demoUser.id,
          platform,
          metric: alert.metric,
          condition: alert.condition,
          threshold: alert.threshold,
          timeframe: alert.timeframe,
          channels: JSON.stringify(['in_app', 'email']),
          isEnabled: true,
          lastChecked: new Date(),
          lastTriggered: i % 2 === 0 ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 