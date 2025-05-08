import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear the database
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.client.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('Password1!', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@ofauto.test',
      password: hashedPassword,
      name: 'Demo User'
    }
  });

  console.log(`Created demo user: ${demoUser.email}`);

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'OnlyFans Client 1',
      platform: 'onlyfans',
      userId: demoUser.id
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Fansly Client 1',
      platform: 'fansly',
      userId: demoUser.id
    }
  });

  console.log(`Created ${2} clients`);

  // Create posts
  const posts = [];
  for (let i = 1; i <= 5; i++) {
    const post = await prisma.post.create({
      data: {
        content: `Demo post ${i} content with some engaging text that would appeal to followers.`,
        status: i <= 3 ? 'published' : 'scheduled',
        scheduledFor: i <= 3 ? null : new Date(Date.now() + 86400000 * i), // Future dates for scheduled posts
        publishedAt: i <= 3 ? new Date(Date.now() - 86400000 * i) : null, // Past dates for published posts
        userId: demoUser.id,
        clientId: i % 2 === 0 ? client2.id : client1.id
      }
    });
    posts.push(post);
  }

  console.log(`Created ${posts.length} posts`);

  // Create comments
  const comments = [];
  for (let i = 1; i <= 10; i++) {
    const comment = await prisma.comment.create({
      data: {
        content: `This is a demo comment ${i}. Great content!`,
        clientId: i % 2 === 0 ? client2.id : client1.id,
        postId: posts[i % posts.length].id
      }
    });
    comments.push(comment);
  }

  console.log(`Created ${comments.length} comments`);

  // Create integrations
  const integration1 = await prisma.integration.create({
    data: {
      name: 'OnlyFans Account',
      type: 'onlyfans',
      config: {
        username: 'demo_of_user',
        connected: true,
        lastSync: new Date().toISOString()
      },
      userId: demoUser.id
    }
  });

  const integration2 = await prisma.integration.create({
    data: {
      name: 'Fansly Account',
      type: 'fansly',
      config: {
        username: 'demo_fansly_user',
        connected: true,
        lastSync: new Date().toISOString()
      },
      userId: demoUser.id
    }
  });

  console.log(`Created ${2} integrations`);

  // Create campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Promotion',
      status: 'active',
      metrics: {
        sent: 150,
        opened: 75,
        clicked: 30,
        converted: 10,
        revenue: 500
      },
      userId: demoUser.id
    }
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'New Content Release',
      status: 'completed',
      metrics: {
        sent: 200,
        opened: 120,
        clicked: 50,
        converted: 25,
        revenue: 1250
      },
      userId: demoUser.id
    }
  });

  console.log(`Created ${2} campaigns`);

  // Create automations
  const automation1 = await prisma.automation.create({
    data: {
      name: 'Welcome Message',
      status: 'active',
      workflow: {
        trigger: 'new_subscriber',
        actions: [
          {
            type: 'send_message',
            delay: 0,
            template: 'Welcome {{name}}! Thanks for subscribing.'
          },
          {
            type: 'send_message',
            delay: 86400, // 1 day
            template: 'Hey {{name}}, how are you enjoying the content so far?'
          }
        ]
      },
      userId: demoUser.id
    }
  });

  const automation2 = await prisma.automation.create({
    data: {
      name: 'Re-engagement',
      status: 'active',
      workflow: {
        trigger: 'inactive_subscriber',
        condition: 'last_active > 30 days',
        actions: [
          {
            type: 'send_message',
            delay: 0,
            template: 'Miss you {{name}}! Check out our new content.'
          },
          {
            type: 'send_discount',
            delay: 172800, // 2 days
            amount: '20%',
            expires: '7 days'
          }
        ]
      },
      userId: demoUser.id
    }
  });

  console.log(`Created ${2} automations`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 