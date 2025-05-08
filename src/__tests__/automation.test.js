import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb } from '../lib/test-utils/db-utils';
import { mockAutomations, mockTasks } from '../mocks/data/automations';
import { mockWebSocket } from '../lib/test-utils/websocket-utils';
import { TriggerType } from '@/lib/orchestration/triggerEngine';

// Import components
// Note: Update these imports based on your actual component paths
import AutomationDashboardPage from '../app/dashboard/automation/page';
import AutomationModal from '../components/automation/automation-modal';
import TaskMonitor from '../components/automation/task-monitor';

describe('Automation Integration Tests', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('Automation Rule Creation', () => {
    test('creates a new automation rule with various triggers', async () => {
      // Setup spy on fetch
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      // Render the automation modal component
      renderWithProviders(
        <AutomationModal 
          isOpen={true} 
          onClose={() => {}} 
          clients={[
            { id: 'client-1', name: 'Sarah Smith' }, 
            { id: 'client-2', name: 'Adam Johnson' }
          ]} 
        />
      );
      
      // Fill out the form
      
      // General settings tab
      // Enter automation name
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Subscriber Dip Automation' }
      });
      
      // Enter description
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Automatically message subscribers when there is a dip in subscription rate' }
      });
      
      // Select client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Select trigger type
      fireEvent.click(screen.getByLabelText(/trigger type/i));
      fireEvent.click(screen.getByText(/subscription dip/i, { selector: '[role="option"]' }));
      
      // Set threshold
      fireEvent.change(screen.getByLabelText(/threshold/i), {
        target: { value: '5' } // 5% threshold
      });
      
      // Set time frame
      fireEvent.click(screen.getByLabelText(/time frame/i));
      fireEvent.click(screen.getByText(/weekly/i, { selector: '[role="option"]' }));
      
      // Switch to Actions tab
      fireEvent.click(screen.getByRole('tab', { name: /actions/i }));
      
      // Add an action
      // Select action type
      fireEvent.click(screen.getByLabelText(/action type/i));
      fireEvent.click(screen.getByText(/send message/i, { selector: '[role="option"]' }));
      
      // Select platform
      fireEvent.click(screen.getByLabelText(/platform/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      
      // Enter message
      fireEvent.change(screen.getByLabelText(/message/i), {
        target: { value: 'Hey there! We noticed you haven\'t been around lately. Here\'s a special discount just for you!' }
      });
      
      // Select audience
      fireEvent.click(screen.getByLabelText(/audience/i));
      fireEvent.click(screen.getByText(/inactive subscribers/i, { selector: '[role="option"]' }));
      
      // Select priority
      fireEvent.click(screen.getByLabelText(/priority/i));
      fireEvent.click(screen.getByText(/high/i, { selector: '[role="option"]' }));
      
      // Create the automation
      fireEvent.click(screen.getByRole('button', { name: /create automation/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/automations',
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
          name: 'Test Subscriber Dip Automation',
          description: 'Automatically message subscribers when there is a dip in subscription rate',
          clientId: 'client-1',
          triggerType: TriggerType.SUBSCRIPTION_DIP,
          conditions: {
            threshold: 0.05,
            timeFrame: 'week'
          },
          actions: [
            expect.objectContaining({
              type: 'message',
              platform: 'onlyfans',
              params: {
                message: 'Hey there! We noticed you haven\'t been around lately. Here\'s a special discount just for you!',
                audience: 'inactive_subscribers'
              },
              priority: 'high'
            })
          ],
          isActive: true
        })
      );
      
      // Verify the automation was created in the mock database
      expect(mockAutomations.some(automation => 
        automation.name === 'Test Subscriber Dip Automation'
      )).toBe(true);
    });
  });

  describe('Visual Rule Builder', () => {
    test('builds complex automation rules with the visual builder', async () => {
      // This test is more complex and depends on the specific implementation of your visual rule builder
      // Here's a skeleton of how it could be done assuming some implementation details
      
      // Render the automation modal component with visual rule builder
      renderWithProviders(
        <AutomationModal 
          isOpen={true} 
          onClose={() => {}} 
          clients={[{ id: 'client-1', name: 'Sarah Smith' }]} 
        />
      );
      
      // Switch to the visual builder mode (if it's a toggle or option)
      const visualBuilderToggle = screen.getByRole('switch', { name: /visual builder/i });
      fireEvent.click(visualBuilderToggle);
      
      // Add a condition group
      fireEvent.click(screen.getByRole('button', { name: /add condition/i }));
      
      // Select condition type
      fireEvent.click(screen.getByLabelText(/condition type/i));
      fireEvent.click(screen.getByText(/roi threshold/i, { selector: '[role="option"]' }));
      
      // Set condition parameters
      fireEvent.change(screen.getByLabelText(/roi value/i), {
        target: { value: '2.5' }
      });
      
      // Add an AND condition
      fireEvent.click(screen.getByRole('button', { name: /add and condition/i }));
      
      // Select second condition type
      const conditionTypeInputs = screen.getAllByLabelText(/condition type/i);
      fireEvent.click(conditionTypeInputs[1]);
      fireEvent.click(screen.getByText(/subscriber count/i, { selector: '[role="option"]' }));
      
      // Set second condition parameters
      fireEvent.change(screen.getByLabelText(/minimum count/i), {
        target: { value: '500' }
      });
      
      // Add action in the visual builder
      fireEvent.click(screen.getByRole('button', { name: /add action/i }));
      
      // Configure the action
      // ...similar to the previous test
      
      // Verify the visual representation matches the expected rule
      const rulePreview = screen.getByTestId('rule-preview');
      expect(rulePreview).toHaveTextContent(/roi threshold.*2.5.*and.*subscriber count.*500/i);
      
      // Submit the rule and verify API call
      // ...similar to the previous test
    });
  });

  describe('Rule Execution and Task Monitoring', () => {
    test('executes an automation rule and monitors its tasks', async () => {
      // Setup
      const automationId = 'automation-1'; // The Subscriber Re-engagement automation
      
      // Render the automation dashboard page
      renderWithProviders(<AutomationDashboardPage />);
      
      // Wait for the automations to load
      await waitFor(() => {
        expect(screen.getByText('Subscriber Re-engagement')).toBeInTheDocument();
      });
      
      // Find the "Run Now" button for the automation
      const automationCard = screen.getByText('Subscriber Re-engagement').closest('[data-testid="automation-card"]');
      const runButton = automationCard.querySelector('button[aria-label="Run automation"]');
      fireEvent.click(runButton);
      
      // Verify the API call to execute the automation
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/automations/${automationId}/execute`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
      
      // Switch to the "Task Monitor" tab
      fireEvent.click(screen.getByRole('tab', { name: /task monitor/i }));
      
      // Wait for the tasks to load
      await waitFor(() => {
        // We should see the original tasks
        expect(screen.getByText('Send re-engagement message')).toBeInTheDocument();
      });
      
      // Simulate receiving a WebSocket event for a new task
      const newTask = {
        id: 'new-task',
        automationId: automationId,
        title: 'Send re-engagement message',
        description: 'Automatically message subscribers who haven\'t engaged in 30 days',
        actionType: 'message',
        platform: 'onlyfans',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the task to the mock database
      mockTasks.push(newTask);
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('task_created', { task: newTask });
      });
      
      // Verify the new task appears in the UI
      await waitFor(() => {
        const taskItems = screen.getAllByText('Send re-engagement message');
        expect(taskItems.length).toBeGreaterThan(1);
      });
      
      // Simulate a task status update via WebSocket
      const updatedTask = {
        ...newTask,
        status: 'running',
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update the task in the mock database
      const taskIndex = mockTasks.findIndex(t => t.id === 'new-task');
      mockTasks[taskIndex] = updatedTask;
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('task_updated', { task: updatedTask });
      });
      
      // Verify the UI reflects the updated status
      await waitFor(() => {
        expect(screen.getByText('running')).toBeInTheDocument();
      });
      
      // Simulate task completion
      const completedTask = {
        ...updatedTask,
        status: 'completed',
        endTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        result: { messageId: 'msg-123', recipientCount: 25 }
      };
      
      // Update the task in the mock database
      mockTasks[taskIndex] = completedTask;
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('task_updated', { task: completedTask });
      });
      
      // Verify the UI reflects the completed status
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
      
      // View task details
      const taskRow = screen.getByText('completed').closest('tr');
      const detailsButton = taskRow.querySelector('button[aria-label="View task details"]');
      fireEvent.click(detailsButton);
      
      // Verify the details modal shows the task result
      await waitFor(() => {
        expect(screen.getByText(/recipientCount/i)).toBeInTheDocument();
        expect(screen.getByText(/25/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Status Updates via WebSockets', () => {
    test('displays real-time updates for automation status', async () => {
      // Render the automation dashboard
      renderWithProviders(<AutomationDashboardPage />);
      
      // Wait for the automations to load
      await waitFor(() => {
        expect(screen.getByText('ROI Optimization')).toBeInTheDocument();
      });
      
      // Get the initial automation state
      const automationCard = screen.getByText('ROI Optimization').closest('[data-testid="automation-card"]');
      expect(automationCard).toHaveTextContent(/active/i);
      
      // Simulate a WebSocket event updating automation status
      const updatedAutomation = {
        ...mockAutomations.find(a => a.name === 'ROI Optimization'),
        isActive: false,
        updatedAt: new Date().toISOString()
      };
      
      // Update the automation in the mock database
      const automationIndex = mockAutomations.findIndex(a => a.name === 'ROI Optimization');
      mockAutomations[automationIndex] = updatedAutomation;
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('automation_updated', { automation: updatedAutomation });
      });
      
      // Verify the UI reflects the changed status
      await waitFor(() => {
        const updatedCard = screen.getByText('ROI Optimization').closest('[data-testid="automation-card"]');
        expect(updatedCard).toHaveTextContent(/inactive/i);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles API errors during rule execution', async () => {
      // Mock a server error for this test
      server.use(
        rest.post('/api/automations/:id/execute', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Failed to execute automation' })
          );
        })
      );
      
      // Render the automation dashboard
      renderWithProviders(<AutomationDashboardPage />);
      
      // Wait for the automations to load
      await waitFor(() => {
        expect(screen.getByText('Subscriber Re-engagement')).toBeInTheDocument();
      });
      
      // Find the "Run Now" button for the automation
      const automationCard = screen.getByText('Subscriber Re-engagement').closest('[data-testid="automation-card"]');
      const runButton = automationCard.querySelector('button[aria-label="Run automation"]');
      fireEvent.click(runButton);
      
      // Verify the error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to execute automation/i)).toBeInTheDocument();
      });
    });

    test('validates rule conditions properly', async () => {
      // Render the automation modal
      renderWithProviders(
        <AutomationModal 
          isOpen={true} 
          onClose={() => {}} 
          clients={[{ id: 'client-1', name: 'Sarah Smith' }]} 
        />
      );
      
      // Try to submit without required fields
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/client is required/i)).toBeInTheDocument();
      });
      
      // Fill just the name and try again
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Automation' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Verify client validation error still shows
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
        expect(screen.getByText(/client is required/i)).toBeInTheDocument();
      });
      
      // Fill client but no actions
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Switch to Actions tab
      fireEvent.click(screen.getByRole('tab', { name: /actions/i }));
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Verify action validation error
      await waitFor(() => {
        expect(screen.getByText(/at least one action is required/i)).toBeInTheDocument();
      });
    });
  });
}); 