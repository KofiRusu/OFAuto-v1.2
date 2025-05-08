import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL
});

(async () => {
  // Connect to Redis
  await redisClient.connect().catch(err => {
    console.error('Redis connection error:', err);
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisClient.isOpen ? 'connected' : 'disconnected'
      }
    });
  });

  // API routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redisClient.disconnect();
  process.exit(0);
}); 