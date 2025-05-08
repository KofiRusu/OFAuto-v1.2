import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { initWebsocketServer } from './websocket';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const { io, emitNewComment, emitActivityUpdate, emitScheduledPostUpdate } = initWebsocketServer(server);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:3015'],
  credentials: true
}));
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make WebSocket helpers available to routes
app.use((req, res, next) => {
  req.emitNewComment = emitNewComment;
  req.emitActivityUpdate = emitActivityUpdate;
  req.emitScheduledPostUpdate = emitScheduledPostUpdate;
  next();
});

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { server, app, io }; 