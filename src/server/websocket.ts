import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users, userActivities, taskComments } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';

// User socket mapping
const connectedUsers = new Map<string, string[]>();

// Define WebSocket event types
export enum WebSocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  AUTHENTICATE = 'authenticate',
  JOIN_TASK = 'join_task',
  LEAVE_TASK = 'leave_task',
  TASK_COMMENT = 'task_comment',
  TASK_UPDATE = 'task_update',
  TYPING_START = 'typing_start',
  TYPING_END = 'typing_end',
  ACTIVITY_UPDATE = 'activity_update',
  NEW_NOTIFICATION = 'new_notification',
  SCHEDULED_POST_UPDATE = 'scheduled_post_update',
}

// Initialize WebSocket server
export const initWebsocketServer = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:3015'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Authenticate middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_in_production') as {
          id: string;
          email: string;
        };
        
        // Get user from database
        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.id),
          columns: {
            id: true,
            email: true,
            role: true
          }
        });
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        // Set user data on socket
        socket.data.user = user;
        next();
      } catch (error) {
        return next(new Error('Invalid authentication token'));
      }
    } catch (error) {
      console.error('WebSocket auth error:', error);
      next(new Error('Authentication error'));
    }
  });
  
  io.on(WebSocketEvents.CONNECT, (socket: Socket) => {
    console.log(`User connected: ${socket.data.user.id}`);
    
    // Add user to connected users map
    const userId = socket.data.user.id;
    const socketId = socket.id;
    
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId)?.push(socketId);
    
    // Handle user joining a task room (for comments)
    socket.on(WebSocketEvents.JOIN_TASK, (taskId: string) => {
      socket.join(`task:${taskId}`);
      console.log(`User ${userId} joined task ${taskId}`);
    });
    
    // Handle user leaving a task room
    socket.on(WebSocketEvents.LEAVE_TASK, (taskId: string) => {
      socket.leave(`task:${taskId}`);
      console.log(`User ${userId} left task ${taskId}`);
    });
    
    // Handle typing indicators
    socket.on(WebSocketEvents.TYPING_START, (data: { taskId: string }) => {
      const { taskId } = data;
      const user = socket.data.user;
      
      socket.to(`task:${taskId}`).emit(WebSocketEvents.TYPING_START, {
        userId: user.id,
        userName: user.name || user.email,
        taskId
      });
    });
    
    socket.on(WebSocketEvents.TYPING_END, (data: { taskId: string }) => {
      const { taskId } = data;
      const user = socket.data.user;
      
      socket.to(`task:${taskId}`).emit(WebSocketEvents.TYPING_END, {
        userId: user.id,
        taskId
      });
    });
    
    // Clean up on disconnect
    socket.on(WebSocketEvents.DISCONNECT, () => {
      console.log(`User disconnected: ${userId}`);
      
      // Remove socket ID from user's connected sockets
      const userSockets = connectedUsers.get(userId) || [];
      const updatedSockets = userSockets.filter(id => id !== socketId);
      
      if (updatedSockets.length === 0) {
        connectedUsers.delete(userId);
      } else {
        connectedUsers.set(userId, updatedSockets);
      }
    });
  });

  // Helper to emit comment updates
  const emitNewComment = async (taskId: string, commentId: string) => {
    try {
      // Get the comment with user info
      const comment = await db.query.taskComments.findFirst({
        where: eq(taskComments.id, commentId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (comment) {
        io.to(`task:${taskId}`).emit(WebSocketEvents.TASK_COMMENT, comment);
      }
    } catch (error) {
      console.error('Error emitting comment update:', error);
    }
  };
  
  // Helper to emit activity updates to relevant users
  const emitActivityUpdate = async (activity: any) => {
    try {
      const { userId, clientId } = activity;
      
      // Emit to the user who created the activity
      const userSockets = connectedUsers.get(userId) || [];
      for (const socketId of userSockets) {
        io.to(socketId).emit(WebSocketEvents.ACTIVITY_UPDATE, activity);
      }
      
      // If there's a client involved, emit to users with access to this client
      if (clientId) {
        // Find users who have access to this client (in a real app, this would 
        // depend on your access control logic)
        const clientUsers = await db.query.users.findMany({
          columns: {
            id: true
          }
        });
        
        for (const user of clientUsers) {
          if (user.id !== userId) { // Avoid duplicate notification to creator
            const userSockets = connectedUsers.get(user.id) || [];
            for (const socketId of userSockets) {
              io.to(socketId).emit(WebSocketEvents.ACTIVITY_UPDATE, activity);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error emitting activity update:', error);
    }
  };
  
  // Helper to emit scheduled post status updates
  const emitScheduledPostUpdate = (postData: { 
    postId: string; 
    status: string; 
    title: string;
    userId: string;
    clientId?: string;
  }) => {
    try {
      const { userId, clientId } = postData;
      
      // Emit to the user who owns the post
      const userSockets = connectedUsers.get(userId) || [];
      for (const socketId of userSockets) {
        io.to(socketId).emit(WebSocketEvents.SCHEDULED_POST_UPDATE, postData);
      }
      
      // If there's a client involved, emit to users with access to this client
      if (clientId) {
        // Find users who have access to this client
        // For simplicity, we'll just notify all users for now
        connectedUsers.forEach((sockets, connectedUserId) => {
          if (connectedUserId !== userId) { // Avoid duplicate notification to creator
            for (const socketId of sockets) {
              io.to(socketId).emit(WebSocketEvents.SCHEDULED_POST_UPDATE, postData);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error emitting scheduled post update:', error);
    }
  };
  
  return {
    io,
    emitNewComment,
    emitActivityUpdate,
    emitScheduledPostUpdate
  };
}; 