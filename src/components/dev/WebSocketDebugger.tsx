'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WebSocketEvents } from '@/server/websocket';

// Format time for display
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

interface WebSocketEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
}

export const WebSocketDebugger: React.FC = () => {
  const { socket, isConnected, connect, disconnect } = useWebSocketContext();
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Show the debugger only in development
  const isDev = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    if (!socket || !isDev) return;
    
    // Track all events for debugging purposes
    const eventHandler = (eventName: string) => (data: any) => {
      setEvents(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          type: eventName,
          data,
          timestamp: new Date()
        },
        ...prev
      ].slice(0, 50)); // Keep only last 50 events
    };
    
    // Register listeners for all known WebSocket events
    Object.values(WebSocketEvents).forEach(eventName => {
      socket.on(eventName, eventHandler(eventName));
    });
    
    // Custom listener for any event
    const originalOnevent = socket.onevent;
    socket.onevent = function(packet: any) {
      const eventName = packet.data[0];
      const data = packet.data.slice(1);
      
      // Only track events not already tracked
      if (!Object.values(WebSocketEvents).includes(eventName)) {
        eventHandler(eventName)(data.length === 1 ? data[0] : data);
      }
      
      // Call original handler
      originalOnevent.call(this, packet);
    };
    
    return () => {
      // Remove all listeners
      Object.values(WebSocketEvents).forEach(eventName => {
        socket.off(eventName);
      });
      
      // Restore original onevent
      socket.onevent = originalOnevent;
    };
  }, [socket, isDev]);
  
  // Handle connection changes
  useEffect(() => {
    if (isConnected && isDev) {
      setEvents(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          type: 'connected',
          data: null,
          timestamp: new Date()
        },
        ...prev
      ]);
    }
  }, [isConnected, isDev]);
  
  // Don't render in production
  if (!isDev) return null;
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsMinimized(false)}
          size="sm"
          variant={isConnected ? "default" : "destructive"}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            WebSocket
          </div>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">WebSocket Debugger</CardTitle>
            <div className="flex gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsMinimized(true)}
              >
                −
              </Button>
            </div>
          </div>
          <CardDescription>
            Realtime event monitor
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <ScrollArea className="h-64 w-full">
            {events.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No events recorded
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <div 
                    key={event.id}
                    className="text-xs p-2 rounded border"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{event.type}</div>
                      <div className="text-muted-foreground">{formatTime(event.timestamp)}</div>
                    </div>
                    {event.data && (
                      <pre className="text-xs bg-muted p-1 rounded max-h-24 overflow-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex justify-between w-full">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => setEvents([])}
            >
              Clear
            </Button>
            <div>
              {isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={connect}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}; 