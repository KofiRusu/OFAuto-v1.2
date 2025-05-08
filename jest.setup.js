// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { server } from './src/mocks/server';
import { resetDb } from './src/lib/test-utils/db-utils';
import { mockWebSocket } from './src/lib/test-utils/websocket-utils';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {}
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock Next/Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
});
afterAll(() => server.close());

// Mock WebSocket
beforeEach(() => {
  mockWebSocket.setup();
});

afterEach(() => {
  mockWebSocket.teardown();
});

// Mock AuthProvider
jest.mock('./src/lib/auth/AuthProvider', () => ({
  __esModule: true,
  default: ({ children }) => children,
  useAuth: () => ({
    user: { 
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn()
  }),
})); 