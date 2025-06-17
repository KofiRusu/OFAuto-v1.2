import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'disconnected'
    }
  });
});

// API routes
app.get('/api/users', async (req, res) => {
  try {
    // Mock data for now
    const users = [
      {
        id: '1',
        email: 'demo@ofauto.test',
        password: 'hashed_password',
        name: 'Demo User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    res.json({ status: 200, data: users });
  } catch (error) {
    res.status(500).json({ status: 500, error: 'Failed to fetch users' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
}); 