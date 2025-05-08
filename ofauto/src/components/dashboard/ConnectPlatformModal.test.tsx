import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectPlatformModal from './ConnectPlatformModal';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';

// Mock the trpc hooks
const mockConnectKofiMutate = jest.fn();
const mockConnectUserPassMutate = jest.fn();
const mockToast = jest.fn();

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    platformConnections: {
      connectKofi: {
        useMutation: jest.fn(),
      },
      connectUserPass: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('ConnectPlatformModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (trpc.platformConnections.connectKofi.useMutation as jest.Mock).mockReturnValue({
      mutate: mockConnectKofiMutate,
      isLoading: false,
    });
    
    (trpc.platformConnections.connectUserPass.useMutation as jest.Mock).mockReturnValue({
      mutate: mockConnectUserPassMutate,
      isLoading: false,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
  });

  it('renders Ko-fi connection form correctly', () => {
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={jest.fn()}
        platformType="kofi"
        platformName="Ko-fi"
        clientId="test-client-id"
      />
    );
    
    expect(screen.getByText('Connect Ko-fi')).toBeInTheDocument();
    expect(screen.getByLabelText('Ko-fi API Key')).toBeInTheDocument();
    expect(screen.getByTestId('connect-submit')).toBeInTheDocument();
  });

  it('renders user/pass connection form correctly for Fansly', () => {
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={jest.fn()}
        platformType="fansly"
        platformName="Fansly"
        clientId="test-client-id"
      />
    );
    
    expect(screen.getByText('Connect Fansly')).toBeInTheDocument();
    expect(screen.getByLabelText('Fansly Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Fansly Password')).toBeInTheDocument();
    expect(screen.getByText('Security Notice')).toBeInTheDocument();
    expect(screen.getByTestId('connect-submit')).toBeInTheDocument();
  });

  it('renders OAuth button for Patreon', () => {
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={jest.fn()}
        platformType="patreon"
        platformName="Patreon"
        clientId="test-client-id"
      />
    );
    
    expect(screen.getByText('Connect Patreon')).toBeInTheDocument();
    expect(screen.getByText('Patreon requires connecting through their secure OAuth process.')).toBeInTheDocument();
    expect(screen.getByTestId('patreon-connect-button')).toBeInTheDocument();
    expect(screen.getByText('Connect via Patreon')).toBeInTheDocument();
  });

  it('handles Ko-fi form submission correctly', async () => {
    const onCloseMock = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={onCloseMock}
        platformType="kofi"
        platformName="Ko-fi"
        clientId="test-client-id"
      />
    );
    
    // Fill in API key
    await user.type(screen.getByTestId('api-key-input'), 'test-api-key-12345');
    
    // Submit form
    await user.click(screen.getByTestId('connect-submit'));
    
    // Check that the mutation was called with the right arguments
    expect(mockConnectKofiMutate).toHaveBeenCalledWith({
      clientId: 'test-client-id',
      platformType: 'kofi',
      apiKey: 'test-api-key-12345',
    });
  });

  it('handles Fansly form submission correctly', async () => {
    const onCloseMock = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={onCloseMock}
        platformType="fansly"
        platformName="Fansly"
        clientId="test-client-id"
      />
    );
    
    // Fill in credentials
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    
    // Submit form
    await user.click(screen.getByTestId('connect-submit'));
    
    // Check that the mutation was called with the right arguments
    expect(mockConnectUserPassMutate).toHaveBeenCalledWith({
      clientId: 'test-client-id',
      platformType: 'fansly',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('displays validation errors for Ko-fi form', async () => {
    const user = userEvent.setup();
    
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={jest.fn()}
        platformType="kofi"
        platformName="Ko-fi"
        clientId="test-client-id"
      />
    );
    
    // Submit form without filling in API key
    await user.click(screen.getByTestId('connect-submit'));
    
    // Check that validation error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('api-key-error')).toBeInTheDocument();
    });
    
    // Check that the mutation was not called
    expect(mockConnectKofiMutate).not.toHaveBeenCalled();
  });

  it('handles the close button correctly', async () => {
    const onCloseMock = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ConnectPlatformModal
        isOpen={true}
        onClose={onCloseMock}
        platformType="kofi"
        platformName="Ko-fi"
        clientId="test-client-id"
      />
    );
    
    // Click the cancel button
    await user.click(screen.getByTestId('cancel-button'));
    
    // Check that the onClose callback was called
    expect(onCloseMock).toHaveBeenCalled();
  });
}); 