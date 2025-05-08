import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/components/ui/use-toast';
import { WebSocketEvents } from '@/server/websocket';
import { useAuth } from '@/hooks/useAuth';

export interface UseWebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  startTyping: (taskId: string) => void;
  stopTyping: (taskId: string) => void;
  error: Error | null;
}

/**
 * Custom hook for WebSocket functionality
 */
export const useWebSocket = ({
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, getToken } = useAuth();
  
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to create a new socket connection
  const createSocketConnection = useCallback(() => {
    const token = getToken();
    
    if (!token || !user) {
      setError(new Error('Authentication required'));
      return null;
    }
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    return newSocket;
  }, [getToken, user]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socket) {
      // Socket already exists, just reconnect if needed
      if (!socket.connected) {
        socket.connect();
      }
      return;
    }
    
    const newSocket = createSocketConnection();
    
    if (!newSocket) return;
    
    // Set up event handlers
    newSocket.on(WebSocketEvents.CONNECT, () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      // Clear any pending reconnect timers
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    });
    
    newSocket.on(WebSocketEvents.DISCONNECT, (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      setIsConnected(false);
      
      // Handle reconnection logic
      if (autoReconnect && ['io server disconnect', 'transport close'].includes(reason)) {
        handleReconnect();
      }
    });
    
    newSocket.on(WebSocketEvents.ERROR, (err) => {
      console.error('WebSocket error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the server. Please try again.',
        variant: 'destructive'
      });
    });
    
    setSocket(newSocket);
  }, [socket, createSocketConnection, autoReconnect, toast]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    
    // Clear any reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [socket]);
  
  // Handle reconnection attempts
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      setError(new Error('Failed to reconnect after maximum attempts'));
      toast({
        title: 'Connection Lost',
        description: 'Failed to reconnect to the server after multiple attempts.',
        variant: 'destructive'
      });
      return;
    }
    
    reconnectAttemptsRef.current += 1;
    
    reconnectTimerRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
      connect();
    }, reconnectInterval);
  }, [connect, maxReconnectAttempts, reconnectInterval, toast]);
  
  // Join a task room for real-time comments
  const joinTask = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit(WebSocketEvents.JOIN_TASK, taskId);
    }
  }, [socket, isConnected]);
  
  // Leave a task room
  const leaveTask = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit(WebSocketEvents.LEAVE_TASK, taskId);
    }
  }, [socket, isConnected]);
  
  // Start typing indicator
  const startTyping = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit(WebSocketEvents.TYPING_START, { taskId });
    }
  }, [socket, isConnected]);
  
  // Stop typing indicator
  const stopTyping = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit(WebSocketEvents.TYPING_END, { taskId });
    }
  }, [socket, isConnected]);
  
  // Automatically connect when the hook is used and user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  return {
    socket,
    isConnected,
    connect,
    disconnect,
    joinTask,
    leaveTask,
    startTyping,
    stopTyping,
    error
  };
}; 