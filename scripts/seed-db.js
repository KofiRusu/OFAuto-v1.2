// Simple script to seed the database without using ts-node
const { PrismaClient, UserRole } = require('@prisma/client');

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
  
  console.log('Created test platform: Twitter');
  
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