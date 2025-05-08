# Manual Insert Instructions – Automation Phase

## Overview
The following API keys, tokens, and session data must be inserted **manually** into the system before deploying to production. These values are intentionally excluded during development and are stored securely via the `CredentialService`.

---

## 🔐 General Storage Method
- All credentials are stored using AES-256-GCM encryption.
- Use `CredentialService.storeCredential(platform, accountId, key, value)` to save values.
- No keys are stored in `.env` for production systems.

---

## Platform Credential Requirements

### 🔵 Telegram
- `telegramBotToken`: Bot token from BotFather
- `telegramChatId`: Channel or user chat ID to send messages

### 🟣 Instagram (Meta Graph API)
- `accessToken`: Long-lived access token (Graph API)
- `instagramBusinessAccountId`: Target IG Business/Creator account ID

### 🐦 Twitter/X
- `twitterAccessToken`: OAuth 2.0 bearer token for the authenticated user
- `twitterUserId`: The numeric ID of the Twitter user account

### 🩵 OnlyFans
- `onlyfansSessionCookies`: Stringified JSON of valid session cookies
- `onlyfansUsername`: (Optional) Fallback login username/email
- `onlyfansPassword`: (Optional) Fallback password
- `onlyfansProfileUrl`: Direct link to dashboard/profile page

### 🍄 Ko-fi Integration
- Add your Ko-fi API Key to .env as: `KOFI_API_KEY=your_kofi_key_here`
- Ensure webhook URL is set in Ko-fi dashboard: `https://yourdomain.com/api/integrations/kofi/webhook`

### 🔍 Fansly Integration
- Store session credentials via CredentialService or add to .env for development:
  ```
  FANSLY_USERNAME=your_username
  FANSLY_PASSWORD=your_password
  ```
- For proxy support (required for production):
  ```
  USE_BRIGHTDATA=true
  BRIGHTDATA_HOST=brd.superproxy.io
  BRIGHTDATA_PORT=22225
  BRIGHTDATA_USERNAME=your_username
  BRIGHTDATA_PASSWORD=your_password
  ```
- Alternative manual proxies configuration:
  ```
  MANUAL_PROXIES=[{"host":"proxy1.example.com","port":8080,"username":"user","password":"pass","protocol":"https"}]
  ```

### 🧠 AI-Powered Insights
To enable AI-powered suggestions and insights:
- Set the following environment variables in production:
  ```
  LLM_PROVIDER=openai    # or anthropic
  LLM_MODEL=gpt-4        # or claude-2 for Anthropic
  LLM_API_KEY=your-api-key-here
  ```
- The system will automatically generate revenue insights, growth strategies, and content recommendations.
- Ensure the database contains sufficient ScheduledPost, AutoDMTask, and revenue data for quality insights.
- For best results, allow at least 30 days of platform data to be collected before generating insights.

### 🧪 A/B Testing Framework
To enable the A/B testing capabilities:
- Ensure the AI-powered insights are properly configured (see above).
- Additional environment variables for A/B testing:
  ```
  # Optional: Set specific model for conclusion generation
  AB_TEST_CONCLUSION_MODEL=gpt-4    # Defaults to value in LLM_MODEL if not specified
  
  # Optional: Configure experiment data retention period (in days)
  EXPERIMENT_DATA_RETENTION=180     # Defaults to 180 days if not specified
  ```
- Performance considerations:
  - A/B testing stores performance data as JSON in the CampaignExperiment model
  - For high-volume campaigns, consider implementing a data archiving strategy
  - The AI conclusion generation requires sufficient data points to be meaningful
  
### ⚡ Advanced Personalization
To enable the personalization features:
- Ensure the AI-powered insights are properly configured (see above).
- For highly personalized recommendations, enrich client persona data:
  - Integrate demographic data from analytics platforms
  - Import engagement patterns from platform analytics
  - You can programmatically update the ClientPersona model for each client:
  ```
  await prisma.clientPersona.upsert({
    where: { clientId: 'client_id_here' },
    update: {
      targetAudience: 'Detailed audience description',
      brandVoice: 'Brand voice characteristics',
      preferences: {
        preferredPostTimes: ['morning', 'evening'],
        contentThemes: ['lifestyle', 'behind-the-scenes']
      },
      engagementPatterns: {
        highEngagementDays: ['Monday', 'Thursday'],
        bestTimeOfDay: '19:00-22:00',
        topContentTypes: ['video', 'poll'],
        averageEngagementRate: 0.23
      }
    },
    create: {
      clientId: 'client_id_here',
      // Same fields as above
    }
  });
  ```

---

## Additional Notes
- All credentials must be valid and refreshed manually when expired.
- For session-based platforms (OnlyFans, Fansly), use Puppeteer to extract session cookies.
- For OAuth-based APIs (Twitter/Instagram), tokens must be refreshed as needed via their respective flows.
- No credentials are logged, and access is role-based.
- For A/B testing and personalization features, ensure the database has proper indexing for performance.
- When generating AI conclusions for experiments, use longer timeframes for more meaningful results.

---

## Insertion Example
```ts
await CredentialService.storeCredential("instagram", "acct_123", "accessToken", ACCESS_TOKEN)
await CredentialService.storeCredential("onlyfans", "acct_789", "onlyfansSessionCookies", cookiesJSON)
await CredentialService.storeCredential("fansly", "acct_456", "fansly_session", sessionJSON)
```

## A/B Testing Setup Example
```ts
// Create a new A/B test experiment
const experiment = await prisma.campaignExperiment.create({
  data: {
    clientId: 'client_id_here',
    name: 'Price Point Optimization',
    description: 'Testing different subscription price points',
    variants: [
      { id: 'A', description: 'Control - Current price ($9.99)' },
      { id: 'B', description: 'Higher price ($14.99)' },
      { id: 'C', description: 'Lower price with upsell ($7.99)' }
    ],
    controlVariantId: 'A',
    goalMetric: 'revenue',
    status: 'running'
  }
});

// Later, update with performance data
await prisma.campaignExperiment.update({
  where: { id: experiment.id },
  data: {
    performanceData: {
      'A': { visitors: 540, count: 43, rate: 0.0796, revenue: 429.57 },
      'B': { visitors: 528, count: 36, rate: 0.0682, revenue: 539.64 },
      'C': { visitors: 562, count: 52, rate: 0.0925, revenue: 415.48 }
    }
  }
});
``` 