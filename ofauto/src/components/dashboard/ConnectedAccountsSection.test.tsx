import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConnectedAccountsSection from './ConnectedAccountsSection';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';

// Mock the trpc hooks
const mockGetStatusQuery = jest.fn();
const mockDisconnectMutation = jest.fn();
const mockMutate = jest.fn();
const mockInvalidate = jest.fn();
const mockToast = jest.fn();

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    platformConnections: {
      getStatus: {
        useQuery: jest.fn(),
      },
      disconnectPlatform: {
        useMutation: jest.fn(),
      },
    },
    useContext: jest.fn(() => ({
      platformConnections: {
        getStatus: {
          invalidate: mockInvalidate,
        },
      },
    })),
  },
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock data
const mockStatuses = {
  patreon: { connected: true, lastUpdated: new Date() },
  kofi: { connected: false },
  fansly: { connected: true, lastUpdated: new Date() },
  onlyfans: { connected: false },
};

describe('ConnectedAccountsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (trpc.platformConnections.getStatus.useQuery as jest.Mock).mockReturnValue({
      data: mockStatuses,
      isLoading: false,
      error: null,
    });
    
    (trpc.platformConnections.disconnectPlatform.useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('renders loading state correctly', () => {
    (trpc.platformConnections.getStatus.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    render(<ConnectedAccountsSection clientId="test-client-id" />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    (trpc.platformConnections.getStatus.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });
    
    render(<ConnectedAccountsSection clientId="test-client-id" />);
    
    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
  });

  it('renders platform connection statuses correctly', () => {
    render(<ConnectedAccountsSection clientId="test-client-id" />);
    
    // Check platforms are rendered
    expect(screen.getByText('Patreon')).toBeInTheDocument();
    expect(screen.getByText('Ko-fi')).toBeInTheDocument();
    expect(screen.getByText('Fansly')).toBeInTheDocument();
    expect(screen.getByText('OnlyFans')).toBeInTheDocument();
    
    // Check connected status
    expect(screen.getAllByText('Connected').length).toBe(2);
    expect(screen.getAllByText('Not Connected').length).toBe(2);
  });

  it('handles disconnecting a platform correctly', async () => {
    render(<ConnectedAccountsSection clientId="test-client-id" />);
    
    // Find a connected platform
    const disconnectButton = screen.getAllByText('Disconnect')[0];
    
    // Click the disconnect button
    fireEvent.click(disconnectButton);
    
    // Confirm the disconnection
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that the mutation was called
    expect(mockMutate).toHaveBeenCalled();
  });

  it('opens the connection modal when Connect button is clicked', () => {
    render(<ConnectedAccountsSection clientId="test-client-id" />);
    
    // Find a platform that's not connected
    const connectButton = screen.getAllByText('Connect')[0];
    
    // Click the connect button
    fireEvent.click(connectButton);
    
    // Check that the modal is opened
    expect(screen.getByTestId('connect-platform-modal')).toBeInTheDocument();
  });
}); 