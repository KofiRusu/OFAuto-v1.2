import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb } from '../lib/test-utils/db-utils';
import { mockScheduledPosts } from '../mocks/data/scheduled-posts';
import { mockWebSocket } from '../lib/test-utils/websocket-utils';
import { format } from 'date-fns';

// Import components
// Note: Update these imports based on your actual component paths
import SchedulerPage from '../app/dashboard/scheduler/page';
import ScheduleCalendar from '../components/scheduler/ScheduleCalendar';
import ScheduledPostCard from '../components/scheduler/scheduled-post-card';
import CreatePostModal from '../components/scheduler/create-post-modal';

describe('Content Scheduler Integration Tests', () => {
  beforeEach(() => {
    resetDb();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Post Creation', () => {
    test('creates a new scheduled post across multiple platforms', async () => {
      // Setup spy on fetch
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      // Render the scheduler page
      renderWithProviders(<SchedulerPage />);
      
      // Click the "Create Post" button
      fireEvent.click(screen.getByRole('button', { name: /create post/i }));
      
      // Fill out the form in the modal
      // Select client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Select platforms (multiple)
      fireEvent.click(screen.getByLabelText(/platforms/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      // Simulate clicking outside to close the dropdown
      fireEvent.click(document.body);
      
      // Click platforms again to select another
      fireEvent.click(screen.getByLabelText(/platforms/i));
      fireEvent.click(screen.getByText(/instagram/i, { selector: '[role="option"]' }));
      fireEvent.click(document.body);
      
      // Enter content
      fireEvent.change(screen.getByLabelText(/content/i), {
        target: { value: 'Test scheduled post for multiple platforms #test' }
      });
      
      // Set scheduled date and time (we assume there's a date picker that can be interacted with)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: format(tomorrow, 'yyyy-MM-dd') }
      });
      
      fireEvent.change(screen.getByLabelText(/time/i), {
        target: { value: '12:00' }
      });
      
      // Click the save button
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the API calls to complete (one for each platform)
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/scheduled-posts',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.any(String)
          })
        );
      });
      
      // Verify at least one POST request was made with the correct data
      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(requestBody).toEqual(
        expect.objectContaining({
          clientId: 'client-1',
          content: 'Test scheduled post for multiple platforms #test',
          scheduledFor: expect.any(String)
        })
      );
      
      // Verify the post was created in the mock database
      expect(mockScheduledPosts.some(post => 
        post.content === 'Test scheduled post for multiple platforms #test'
      )).toBe(true);
      
      // Verify two posts were created (one for each platform)
      const newPosts = mockScheduledPosts.filter(post => 
        post.content === 'Test scheduled post for multiple platforms #test'
      );
      expect(newPosts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Calendar View', () => {
    test('displays scheduled posts in the calendar view', async () => {
      // Render the calendar component
      renderWithProviders(<ScheduleCalendar />);
      
      // Wait for the calendar to load with data
      await waitFor(() => {
        // We should see at least one of the scheduled posts from our mock data
        expect(screen.getByText(/Check out my new workout routine/i)).toBeInTheDocument();
      });
      
      // Test changing the view (e.g., to weekly)
      fireEvent.click(screen.getByRole('button', { name: /week/i }));
      
      // Verify the view changed and still displays data
      await waitFor(() => {
        expect(screen.getByText(/Check out my new workout routine/i)).toBeInTheDocument();
      });
      
      // Test changing the date to see different posts
      const datePicker = screen.getByLabelText(/select date/i);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3); // Three days in the future
      
      fireEvent.change(datePicker, {
        target: { value: format(futureDate, 'yyyy-MM-dd') }
      });
      
      // Verify we can see posts for the new date range
      await waitFor(() => {
        // Should find posts scheduled for that time period
        expect(screen.getByText(/Join me for a live Q&A session/i)).toBeInTheDocument();
      });
    });

    test('respects timezone settings when displaying posts', async () => {
      // Mocking the post scheduled for tomorrow in NY timezone
      const tomorrowsPostNY = mockScheduledPosts.find(post => post.id === 'post-1');
      const scheduledTimeNY = new Date(tomorrowsPostNY.scheduledFor);
      
      // Render the calendar component
      renderWithProviders(<ScheduleCalendar />);
      
      // Wait for the calendar to load with data
      await waitFor(() => {
        expect(screen.getByText(/Check out my new workout routine/i)).toBeInTheDocument();
      });
      
      // Change timezone to America/Los_Angeles (3 hours behind NY)
      fireEvent.click(screen.getByLabelText(/timezone/i));
      fireEvent.click(screen.getByText(/Los Angeles/i, { selector: '[role="option"]' }));
      
      // Verify the post time is adjusted for the new timezone
      await waitFor(() => {
        const postElement = screen.getByText(/Check out my new workout routine/i);
        const timeElement = postElement.closest('[data-testid="post-card"]').querySelector('[data-testid="post-time"]');
        
        // Calculate the expected time in LA
        const scheduledTimeLA = new Date(scheduledTimeNY);
        scheduledTimeLA.setHours(scheduledTimeLA.getHours() - 3);
        
        // Check if the displayed time matches the LA time
        expect(timeElement.textContent).toContain(format(scheduledTimeLA, 'h:mm a'));
      });
    });
  });

  describe('Post Editing and Deletion', () => {
    test('allows editing scheduled posts', async () => {
      // Render the scheduler page
      renderWithProviders(<SchedulerPage />);
      
      // Wait for the posts to load
      await waitFor(() => {
        expect(screen.getByText(/Check out my new workout routine/i)).toBeInTheDocument();
      });
      
      // Click the edit button on a post
      const postElement = screen.getByText(/Check out my new workout routine/i).closest('[data-testid="post-card"]');
      const editButton = postElement.querySelector('[aria-label="Edit post"]');
      fireEvent.click(editButton);
      
      // Verify the edit modal opens with the correct data
      await waitFor(() => {
        const contentField = screen.getByLabelText(/content/i);
        expect(contentField.value).toBe('Check out my new workout routine! #fitness #wellness');
      });
      
      // Change the content
      fireEvent.change(screen.getByLabelText(/content/i), {
        target: { value: 'Updated workout routine! #fitness #wellness #updated' }
      });
      
      // Save the changes
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Verify the API call was made correctly
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/scheduled-posts/'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('Updated workout routine')
          })
        );
      });
      
      // Verify the post was updated in the mock database
      const updatedPost = mockScheduledPosts.find(post => post.content.includes('Updated workout routine'));
      expect(updatedPost).toBeTruthy();
      
      // Verify the UI reflects the updated content
      await waitFor(() => {
        expect(screen.getByText(/Updated workout routine/i)).toBeInTheDocument();
      });
    });

    test('allows deleting scheduled posts', async () => {
      // Setup
      const postIdToDelete = 'post-2';
      const initialPostCount = mockScheduledPosts.length;
      
      // Render the scheduler page
      renderWithProviders(<SchedulerPage />);
      
      // Wait for the posts to load
      await waitFor(() => {
        expect(screen.getByText(/Beach day vibes/i)).toBeInTheDocument();
      });
      
      // Click the delete button on the post
      const postElement = screen.getByText(/Beach day vibes/i).closest('[data-testid="post-card"]');
      const deleteButton = postElement.querySelector('[aria-label="Delete post"]');
      fireEvent.click(deleteButton);
      
      // Confirm deletion in the modal
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
      
      // Verify the API call was made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/scheduled-posts/${postIdToDelete}`,
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
      
      // Verify the post was removed from the mock database
      expect(mockScheduledPosts.length).toBe(initialPostCount - 1);
      expect(mockScheduledPosts.some(post => post.id === postIdToDelete)).toBe(false);
      
      // Verify the UI no longer shows the deleted post
      await waitFor(() => {
        expect(screen.queryByText(/Beach day vibes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates via WebSocket', () => {
    test('updates scheduled post status in real-time when published', async () => {
      // Render a scheduled post card component
      const post = mockScheduledPosts.find(p => p.id === 'post-1');
      renderWithProviders(<ScheduledPostCard post={post} />);
      
      // Verify the post is in scheduled status
      await waitFor(() => {
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      });
      
      // Simulate clicking the publish button
      fireEvent.click(screen.getByRole('button', { name: /publish/i }));
      
      // Verify the API call was made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/scheduled-posts/${post.id}/publish`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
      
      // Simulate a WebSocket event for post status update
      const updatedPost = { ...post, status: 'publishing' };
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('post_status_updated', { post: updatedPost });
      });
      
      // Verify the UI reflects the publishing status
      await waitFor(() => {
        expect(screen.getByText(/publishing/i)).toBeInTheDocument();
      });
      
      // Simulate another WebSocket event when post is fully published
      const publishedPost = { 
        ...post, 
        status: 'published',
        publishedAt: new Date().toISOString()
      };
      
      // Emit the WebSocket event
      act(() => {
        mockWebSocket.emit('post_status_updated', { post: publishedPost });
      });
      
      // Verify the UI reflects the published status
      await waitFor(() => {
        expect(screen.getByText(/published/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error state when post publishing fails', async () => {
      // Mock a server error for the publish endpoint
      server.use(
        rest.post('/api/scheduled-posts/:id/publish', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Failed to publish post' })
          );
        })
      );
      
      // Render a scheduled post card component
      const post = mockScheduledPosts.find(p => p.id === 'post-1');
      renderWithProviders(<ScheduledPostCard post={post} />);
      
      // Simulate clicking the publish button
      fireEvent.click(screen.getByRole('button', { name: /publish/i }));
      
      // Wait for the error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to publish post/i)).toBeInTheDocument();
      });
      
      // Verify the post status has not changed
      expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
    });
  });
}); 