import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

// Define custom metrics
const errorRate = new Rate('error_rate');
const apiCallCount = new Counter('api_calls');
const apiResponseTime = new Trend('api_response_time');

// Parameters used for authentication
const AUTH_ENDPOINT = "https://staging.ofauto.com/api/auth/token";
const API_BASE_URL = "https://staging.ofauto.com/api";
// We'll use a mock token in this test - in a real test, we would fetch a real token
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2ODUzMDMyMDh9.mock";

// Define test configuration
export const options = {
  // Simulate 20 virtual users
  vus: 20,
  // Test runs for 30 seconds
  duration: '30s',
  // Define thresholds for pass/fail criteria
  thresholds: {
    'error_rate': ['rate<0.05'], // Error rate must be less than 5%
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.05'], // HTTP error rate must be less than 5%
    'api_response_time{endpoint:health}': ['p(95)<200'], // Health check should be fast
    'api_response_time{endpoint:dashboard.getStats}': ['p(95)<750'], // Dashboard stats can take longer
    'api_response_time{endpoint:scheduledPost.getCalendarEvents}': ['p(95)<750'], // Calendar can take longer
    'api_response_time{endpoint:metrics.getUnifiedMetrics}': ['p(95)<1000'], // Metrics can take even longer
    'api_response_time{endpoint:linktree}': ['p(95)<500'], // Linktree should be fast
    'api_response_time{endpoint:campaignChatbot}': ['p(95)<1500'], // Campaign chatbot can be slower (AI generation)
  },
};

// Test setup - will run once per VU
export function setup() {
  // In a real test, we would fetch an authentication token here
  // For the mock, we'll just return our predefined token
  return { token: AUTH_TOKEN };
}

// Main function - this is where the test scenario happens
export default function(data) {
  // Set auth header to be used with all requests
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test API Health endpoint
  group('Health Check', function () {
    const res = http.get(`${API_BASE_URL}/health`, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(res.timings.duration, { endpoint: 'health' });
    
    const success = check(res, {
      'Health check status is 200': (r) => r.status === 200,
      'Health status is "healthy"': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy';
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!success);
  });

  // Small wait between requests to simulate user behavior
  sleep(1);

  // Test Dashboard Stats API
  group('Dashboard Stats', function () {
    const dashboardData = JSON.stringify({
      period: 'last30days',
    });
    
    const res = http.post(`${API_BASE_URL}/trpc/dashboard.getStats`, dashboardData, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(res.timings.duration, { endpoint: 'dashboard.getStats' });
    
    const success = check(res, {
      'Dashboard stats status is 200': (r) => r.status === 200,
      'Dashboard stats returns valid data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result && body.result.data;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!success);
  });

  // Test Scheduled Posts Calendar API
  group('Calendar Events', function () {
    const calendarData = JSON.stringify({
      start: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
      end: new Date(Date.now() + 14 * 86400000).toISOString(),  // 14 days in future
    });
    
    const res = http.post(`${API_BASE_URL}/trpc/scheduledPost.getCalendarEvents`, calendarData, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(res.timings.duration, { endpoint: 'scheduledPost.getCalendarEvents' });
    
    const success = check(res, {
      'Calendar events status is 200': (r) => r.status === 200,
      'Calendar events returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result && Array.isArray(body.result.data);
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!success);
  });
  
  // Test Unified Metrics API
  group('Unified Metrics', function () {
    const metricsData = JSON.stringify({
      period: 'last30days',
      platforms: ['instagram', 'tiktok', 'onlyfans'],
    });
    
    const res = http.post(`${API_BASE_URL}/trpc/metrics.getUnifiedMetrics`, metricsData, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(res.timings.duration, { endpoint: 'metrics.getUnifiedMetrics' });
    
    const success = check(res, {
      'Unified metrics status is 200': (r) => r.status === 200,
      'Unified metrics returns valid data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result && body.result.data;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!success);
  });

  // Test Linktree Config API
  group('Linktree Config', function () {
    // Get user's linktree config
    const getRes = http.post(`${API_BASE_URL}/trpc/linktree.getLinktreeConfig`, '{}', params);
    
    apiCallCount.add(1);
    apiResponseTime.add(getRes.timings.duration, { endpoint: 'linktree' });
    
    const getSuccess = check(getRes, {
      'Get linktree config status is 200': (r) => r.status === 200,
    });

    errorRate.add(!getSuccess);

    // Update linktree config with random data
    const linksData = JSON.stringify({
      links: [
        { title: 'Instagram', url: 'https://instagram.com/testuser' },
        { title: 'TikTok', url: 'https://tiktok.com/@testuser' },
        { title: `Test Link ${randomString(5)}`, url: 'https://example.com' }
      ],
      theme: 'default',
    });

    const updateRes = http.post(`${API_BASE_URL}/trpc/linktree.updateLinktreeConfig`, linksData, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(updateRes.timings.duration, { endpoint: 'linktree' });
    
    const updateSuccess = check(updateRes, {
      'Update linktree config status is 200': (r) => r.status === 200,
    });

    errorRate.add(!updateSuccess);
  });

  // Test Campaign Chatbot API
  group('Campaign Chatbot', function () {
    // Generate campaign ideas
    const ideaRequest = JSON.stringify({
      context: `Generate social media campaign ideas for a fitness creator ${randomString(5)}`,
      platform: 'Instagram',
      targetAudience: 'Fitness enthusiasts aged 25-40',
      goals: 'Increase follower engagement',
    });

    const res = http.post(`${API_BASE_URL}/trpc/campaignChatbot.generateCampaignIdeas`, ideaRequest, params);
    
    apiCallCount.add(1);
    apiResponseTime.add(res.timings.duration, { endpoint: 'campaignChatbot' });
    
    const success = check(res, {
      'Generate campaign ideas status is 200': (r) => r.status === 200,
      'Campaign ideas returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result && Array.isArray(body.result.data.ideas);
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!success);
  });

  // Small wait between tests to make the test more realistic
  sleep(2);
}

// Teardown function - runs after the test
export function teardown(data) {
  // In a real test, we'd perform cleanup here
  console.log('Load test completed successfully');
} 