'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useWebSocket, UseWebSocketReturn } from '@/hooks/useWebSocket';
import { WebSocketEvents } from '@/server/websocket';

// Context type
type WebSocketContextType = UseWebSocketReturn & {
  typingUsers: Record<string, { userId: string; userName: string }>;
};

// Default value for the context
const defaultContext: WebSocketContextType = {
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  joinTask: () => {},
  leaveTask: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  error: null,
  typingUsers: {}
};

// Create context
const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const websocket = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; userName: string }>>({});
  
  // Handle typing indicator events
  useEffect(() => {
    const { socket } = websocket;
    if (!socket) return;
    
    const handleTypingStart = (data: { userId: string; userName: string; taskId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [`${data.taskId}-${data.userId}`]: {
          userId: data.userId,
          userName: data.userName
        }
      }));
    };
    
    const handleTypingEnd = (data: { userId: string; taskId: string }) => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[`${data.taskId}-${data.userId}`];
        return newState;
      });
    };
    
    socket.on(WebSocketEvents.TYPING_START, handleTypingStart);
    socket.on(WebSocketEvents.TYPING_END, handleTypingEnd);
    
    return () => {
      socket.off(WebSocketEvents.TYPING_START, handleTypingStart);
      socket.off(WebSocketEvents.TYPING_END, handleTypingEnd);
    };
  }, [websocket.socket]);
  
  // Reset typing users when connection state changes
  useEffect(() => {
    if (!websocket.isConnected) {
      setTypingUsers({});
    }
  }, [websocket.isConnected]);
  
  // Context value
  const value: WebSocketContextType = {
    ...websocket,
    typingUsers
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 