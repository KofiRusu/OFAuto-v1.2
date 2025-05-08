import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { createMockRouter } from '@/test/mocks/router';
import '@testing-library/jest-dom';
import OrganizationManagementPage from '@/app/dashboard/admin/organization/page';
import ClientOrgSettingsPage from '@/app/dashboard/admin/organization/[clientId]/page';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    userId: 'user-123',
    sessionClaims: {
      userRole: 'ADMIN',
    },
  })),
}));

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    organization: {
      getAllClientsWithOrgData: {
        useQuery: jest.fn(),
      },
      getClientWithOrgData: {
        useQuery: jest.fn(),
      },
      getOrgSettings: {
        useQuery: jest.fn(),
      },
      generateReferralCode: {
        useMutation: jest.fn(),
      },
      updateOrgSettings: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('@/components/spinner', () => ({
  Spinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/forbidden', () => ({
  __esModule: true,
  default: () => <div data-testid="forbidden">Access Denied</div>,
}));

describe('Organization Management UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('OrganizationManagementPage', () => {
    it('should render the client list when data is loaded', async () => {
      // Mock the trpc query to return client data
      (trpc.organization.getAllClientsWithOrgData.useQuery as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'client-1',
            name: 'Test Client',
            email: 'client@example.com',
            referralCode: 'TEST-123',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
        refetch: jest.fn(),
      });
      
      // Mock the mutation for generating referral codes
      (trpc.organization.generateReferralCode.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
      });
      
      const mockRouter = createMockRouter({});
      
      render(
        <RouterContext.Provider value={mockRouter}>
          <OrganizationManagementPage />
        </RouterContext.Provider>
      );
      
      // Check if the page title is rendered
      expect(screen.getByText('Organization Management')).toBeInTheDocument();
      
      // Check if client data is displayed
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('client@example.com')).toBeInTheDocument();
      expect(screen.getByText('TEST-123')).toBeInTheDocument();
      
      // Check if buttons are rendered
      expect(screen.getByText('Regenerate Code')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    it('should show loading state when data is loading', () => {
      // Mock the trpc query to return loading state
      (trpc.organization.getAllClientsWithOrgData.useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: jest.fn(),
      });
      
      const mockRouter = createMockRouter({});
      
      render(
        <RouterContext.Provider value={mockRouter}>
          <OrganizationManagementPage />
        </RouterContext.Provider>
      );
      
      // Check if loading spinner is displayed
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
    
    it('should handle generating a referral code', async () => {
      // Mock the trpc query to return client data
      (trpc.organization.getAllClientsWithOrgData.useQuery as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'client-1',
            name: 'Test Client',
            email: 'client@example.com',
            referralCode: null,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
        refetch: jest.fn(),
      });
      
      // Mock the mutation
      const mutateMock = jest.fn();
      (trpc.organization.generateReferralCode.useMutation as jest.Mock).mockReturnValue({
        mutate: mutateMock,
        isLoading: false,
      });
      
      const mockRouter = createMockRouter({});
      
      render(
        <RouterContext.Provider value={mockRouter}>
          <OrganizationManagementPage />
        </RouterContext.Provider>
      );
      
      // Find and click the Generate Code button
      const generateButton = screen.getByText('Generate Code');
      fireEvent.click(generateButton);
      
      // Check if mutation was called with correct client ID
      expect(mutateMock).toHaveBeenCalledWith({ clientId: 'client-1' });
    });
  });
  
  describe('ClientOrgSettingsPage', () => {
    it('should render client settings', async () => {
      // Mock the client data query
      (trpc.organization.getClientWithOrgData.useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'client-1',
          name: 'Test Client',
          email: 'client@example.com',
          phone: '123-456-7890',
          status: 'ACTIVE',
          referralCode: 'TEST-123',
        },
        isLoading: false,
      });
      
      // Mock the org settings query
      (trpc.organization.getOrgSettings.useQuery as jest.Mock).mockReturnValue({
        data: {
          clientId: 'client-1',
          settings: {
            branding: {
              primaryColor: '#4f46e5',
              secondaryColor: '#f97316',
              logoUrl: null,
              favicon: null,
            },
            features: {
              enableReferrals: true,
              enableActivityLogs: true,
              enablePerformanceReports: true,
              enableNotifications: true,
            },
            communication: {
              emailFooter: 'Powered by OFAuto',
              emailReplyTo: null,
              notificationPreferences: {
                email: true,
                inApp: true,
              },
            },
            privacy: {
              dataSharingEnabled: false,
              retentionPeriodDays: 365,
            },
            billing: {
              paymentTerms: 'net30',
              taxRate: 0,
            },
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      });
      
      // Mock the mutations
      (trpc.organization.generateReferralCode.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
      });
      
      (trpc.organization.updateOrgSettings.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
      });
      
      const mockRouter = createMockRouter({});
      
      render(
        <RouterContext.Provider value={mockRouter}>
          <ClientOrgSettingsPage params={{ clientId: 'client-1' }} />
        </RouterContext.Provider>
      );
      
      // Check if client info is displayed
      expect(screen.getByText('Test Client Settings')).toBeInTheDocument();
      expect(screen.getByText('client@example.com')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('TEST-123')).toBeInTheDocument();
      
      // Check if tabs are displayed
      expect(screen.getByRole('tab', { name: 'Branding' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Features' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Communication' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Privacy' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Billing' })).toBeInTheDocument();
      
      // Default tab should be Branding
      expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
      
      // Click on Features tab
      fireEvent.click(screen.getByRole('tab', { name: 'Features' }));
      
      // Should show features content
      expect(screen.getByText('Enable Referrals')).toBeInTheDocument();
      expect(screen.getByText('Enable Activity Logs')).toBeInTheDocument();
    });
    
    it('should handle settings updates', async () => {
      // Mock the client data query
      (trpc.organization.getClientWithOrgData.useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'client-1',
          name: 'Test Client',
          email: 'client@example.com',
          status: 'ACTIVE',
          referralCode: 'TEST-123',
        },
        isLoading: false,
      });
      
      // Mock the org settings query
      (trpc.organization.getOrgSettings.useQuery as jest.Mock).mockReturnValue({
        data: {
          clientId: 'client-1',
          settings: {
            branding: {
              primaryColor: '#4f46e5',
              secondaryColor: '#f97316',
              logoUrl: null,
              favicon: null,
            },
            features: {
              enableReferrals: true,
              enableActivityLogs: true,
              enablePerformanceReports: true,
              enableNotifications: true,
            },
            communication: {
              emailFooter: 'Powered by OFAuto',
              emailReplyTo: null,
              notificationPreferences: {
                email: true,
                inApp: true,
              },
            },
            privacy: {
              dataSharingEnabled: false,
              retentionPeriodDays: 365,
            },
            billing: {
              paymentTerms: 'net30',
              taxRate: 0,
            },
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      });
      
      // Mock the update settings mutation
      const updateMutateMock = jest.fn();
      (trpc.organization.updateOrgSettings.useMutation as jest.Mock).mockReturnValue({
        mutate: updateMutateMock,
        isLoading: false,
      });
      
      (trpc.organization.generateReferralCode.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
      });
      
      const mockRouter = createMockRouter({});
      
      render(
        <RouterContext.Provider value={mockRouter}>
          <ClientOrgSettingsPage params={{ clientId: 'client-1' }} />
        </RouterContext.Provider>
      );
      
      // Change primary color
      const primaryColorInput = screen.getAllByLabelText('Primary Color')[1]; // Get the text input, not color picker
      fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });
      
      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      // Check if mutation was called with updated settings
      expect(updateMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-1',
          settings: expect.objectContaining({
            branding: expect.objectContaining({
              primaryColor: '#FF0000',
            }),
          }),
        })
      );
    });
  });
}); 