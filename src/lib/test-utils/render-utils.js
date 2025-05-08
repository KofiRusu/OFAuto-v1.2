import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';

// Create a custom render that includes providers
export function renderWithProviders(
  ui,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        }
      }
    }),
    ...renderOptions
  } = {}
) {
  // Wrap the component with all the necessary providers
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </QueryClientProvider>
    );
  }

  // Return the rendered component with extra utils
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
}

// Async wait utility
export function waitForTimeout(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock the fetch API for testing
export function mockFetch(mockData, status = 200) {
  const mockResponse = {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(mockData)
  };
  
  global.fetch = jest.fn().mockResolvedValue(mockResponse);
  
  return {
    fetch: global.fetch,
    response: mockResponse
  };
}

// Reset the fetch mock
export function resetFetchMock() {
  if (global.fetch && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset();
  }
} 