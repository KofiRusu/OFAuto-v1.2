// src/lib/test-utils/websocket-utils.js

class MockWebSocketServer {
  constructor() {
    this.handlers = {};
    this.connected = false;
    this.messageHistory = [];
  }

  // Server API
  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(event, data) {
    this.messageHistory.push({ event, data, direction: 'server-to-client' });
    
    if (this.handlers[event]) {
      this.handlers[event].forEach(callback => {
        if (typeof callback === 'function') {
          callback(data);
        }
      });
    }
    
    return this;
  }

  // Setup and teardown for tests
  setup() {
    this.connected = true;
    this.messageHistory = [];
    
    // Mock the socket.io-client
    jest.mock('socket.io-client', () => {
      return jest.fn(() => this);
    });
    
    return this;
  }

  teardown() {
    this.connected = false;
    this.handlers = {};
    this.messageHistory = [];
    
    // Clear mocks
    jest.resetModules();
    
    return this;
  }

  // Client API (used by the WebSocket provider)
  connect() {
    this.connected = true;
    if (this.handlers.connect) {
      this.handlers.connect.forEach(callback => callback());
    }
  }

  disconnect() {
    this.connected = false;
    if (this.handlers.disconnect) {
      this.handlers.disconnect.forEach(callback => callback());
    }
  }

  // Utility methods for testing
  emitClientEvent(event, data) {
    this.messageHistory.push({ event, data, direction: 'client-to-server' });
    
    // In a real socket, the client emit just sends the event, it doesn't trigger a callback directly
    // To simulate the full flow, you'd typically need the server to respond with another event
    return this;
  }
  
  getMessageHistory() {
    return [...this.messageHistory];
  }
  
  clearMessageHistory() {
    this.messageHistory = [];
    return this;
  }
}

export const mockWebSocket = new MockWebSocketServer(); 