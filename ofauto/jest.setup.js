// Import jest-dom utilities for DOM assertions
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/test-pathname',
  }),
  usePathname: () => '/test-pathname',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: jest.fn(() => ({
      invalidate: jest.fn(),
    })),
    platformConnections: {
      getStatus: {
        useQuery: jest.fn(),
      },
      connectKofi: {
        useMutation: jest.fn(),
      },
      connectUserPass: {
        useMutation: jest.fn(),
      },
      disconnectPlatform: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  })),
}));

// Suppress console errors during tests
global.console.error = jest.fn();

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 