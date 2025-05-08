import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb, getTestClient } from '../lib/test-utils/db-utils';
import { mockClients } from '../mocks/data/clients';

// Import the components to test
// Note: These imports would need to be adjusted based on your actual component paths
import ClientListPage from '../app/dashboard/clients/page';
import ClientDetailPage from '../app/dashboard/clients/[id]/page';
import ClientForm from '../components/clients/client-form';

describe('Client Management Integration Tests', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('Client Creation', () => {
    test('creates a new client and adds it to the database', async () => {
      // Setup spy on fetch
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      // Render the client form component
      renderWithProviders(<ClientForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'New Test Client' }
      });
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newclient@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+1234567890' }
      });
      
      // Select active status
      fireEvent.click(screen.getByLabelText(/status/i));
      fireEvent.click(screen.getByText(/active/i));
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/clients',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.any(String)
          })
        );
      });
      
      // Verify the request payload
      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(requestBody).toEqual(
        expect.objectContaining({
          name: 'New Test Client',
          email: 'newclient@example.com',
          phone: '+1234567890',
          status: 'active'
        })
      );
      
      // Verify that the mock database was updated
      expect(mockClients.some(client => client.name === 'New Test Client')).toBe(true);
    });
  });

  describe('Client Retrieval and Filtering', () => {
    test('displays clients and filters them by search term', async () => {
      // Render the client list page
      renderWithProviders(<ClientListPage />);
      
      // Wait for the clients to load
      await waitFor(() => {
        expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
        expect(screen.getByText('Adam Johnson')).toBeInTheDocument();
        expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      });
      
      // Search for "Sarah"
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      
      // Wait for the search results
      await waitFor(() => {
        expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
        expect(screen.queryByText('Adam Johnson')).not.toBeInTheDocument();
        expect(screen.queryByText('Emily Chen')).not.toBeInTheDocument();
      });
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      // All clients should be displayed again
      await waitFor(() => {
        expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
        expect(screen.getByText('Adam Johnson')).toBeInTheDocument();
        expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      });
      
      // Filter by status
      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.click(statusFilter);
      fireEvent.click(screen.getByText(/inactive/i));
      
      // Only inactive clients should be displayed
      await waitFor(() => {
        expect(screen.queryByText('Sarah Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Adam Johnson')).not.toBeInTheDocument();
        expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      });
    });
  });

  describe('Client Update', () => {
    test('updates client details in the database', async () => {
      // Mock the client detail route
      const clientId = 'client-1';
      const mockedRouter = { query: { id: clientId } };
      
      // Override the useRouter mock for this test
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: clientId })
      }));
      
      // Render the client detail page with the mocked router
      renderWithProviders(<ClientDetailPage />);
      
      // Wait for the client data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Sarah Smith')).toBeInTheDocument();
      });
      
      // Change the client name
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Sarah Smith Updated' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/clients/${clientId}`,
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('Sarah Smith Updated')
          })
        );
      });
      
      // Verify the client was updated in the mock database
      const updatedClient = mockClients.find(c => c.id === clientId);
      expect(updatedClient.name).toBe('Sarah Smith Updated');
    });
  });

  describe('Client Deletion', () => {
    test('deletes a client and removes it from the database', async () => {
      // Setup
      const clientIdToDelete = 'client-2';
      const initialClientCount = mockClients.length;
      
      // Render the client list page
      renderWithProviders(<ClientListPage />);
      
      // Wait for the clients to load
      await waitFor(() => {
        expect(screen.getByText('Adam Johnson')).toBeInTheDocument();
      });
      
      // Open the menu for the client we want to delete
      const clientRows = screen.getAllByRole('row');
      const adamRow = Array.from(clientRows).find(row => row.textContent.includes('Adam Johnson'));
      const menuButton = adamRow.querySelector('button[aria-label="Open menu"]');
      fireEvent.click(menuButton);
      
      // Click the delete option
      fireEvent.click(screen.getByText(/delete/i));
      
      // Confirm deletion in the modal
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/clients/${clientIdToDelete}`,
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
      
      // Verify the client was removed from the mock database
      expect(mockClients.length).toBe(initialClientCount - 1);
      expect(mockClients.some(client => client.id === clientIdToDelete)).toBe(false);
      
      // Verify the client is no longer displayed
      await waitFor(() => {
        expect(screen.queryByText('Adam Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when client creation fails', async () => {
      // Mock a server error for this test
      server.use(
        rest.post('/api/clients', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Failed to create client' })
          );
        })
      );
      
      // Render the client form component
      renderWithProviders(<ClientForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Error Test Client' }
      });
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'errorclient@example.com' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create client/i)).toBeInTheDocument();
      });
      
      // Verify the client was not added to the mock database
      expect(mockClients.some(client => client.name === 'Error Test Client')).toBe(false);
    });
  });
}); 