import express from 'express';
import cors from 'cors';
// Import types from the shared types package
import type { User, ApiResponse } from '@ofauto/types';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Configure CORS with proper typing
const corsOptions: cors.CorsOptions = {
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3015')
    .split(',')
    .map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'mock',
    redis: 'mock',
    version: '1.0.0'
  });
});

// Example API endpoint
app.get('/api/users', async (req, res) => {
  try {
    // Mock data for testing
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'demo@ofauto.test',
        name: 'Demo User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const response: ApiResponse<User[]> = {
      success: true,
      data: mockUsers,
      message: 'Users fetched successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch users'
    };
    res.status(500).json(response);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});