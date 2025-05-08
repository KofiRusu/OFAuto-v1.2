# OFAuto Beta Testing Notes

Thank you for participating in the OFAuto beta testing program! This document provides instructions for setting up, testing, and reporting issues.

## ✅ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/OFAuto.git
   cd OFAuto
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your own API keys and credentials as needed
   - Important variables to set:
     - `STRIPE_SECRET_KEY` (use test key: `sk_test_...`)
     - `STRIPE_PUBLISHABLE_KEY` (use test key: `pk_test_...`)
     - `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard)
     - `CREDENTIAL_ENCRYPTION_KEY` (for secure storage of platform credentials)

4. **Start the development server**
   ```bash
   pnpm dev
   ```
   The application will be available at http://localhost:3015

5. **Alternative: Vercel deployment**
   - Fork the repository
   - Create a new Vercel project
   - Link it to your forked repository
   - Configure environment variables in the Vercel dashboard

## 🧪 What to Test

Please focus your testing on these key areas:

### Platform Connections
- Connect at least one platform (Patreon, Instagram, etc.)
- Verify connection status is displayed correctly
- Test disconnecting and reconnecting

### Content Automation
- Create a scheduled post
- Trigger an auto-DM workflow
- Test content creation with different settings (public/PPV/etc.)

### Media Upload
- Test uploading from Google Drive
- Try different media types (images/videos)
- Verify media appears correctly in posts

### Payments
- Use Stripe test cards to simulate payments
  - Test card: `4242 4242 4242 4242` (successful payment)
  - Test card: `4000 0000 0000 9995` (declined payment)
- Verify webhook functionality by checking server logs

## ⚠️ Known Issues

Please be aware of these known limitations during testing:

- **Media uploads** are partially implemented/stubbed in some integrations
- **OAuth flows** for some platforms are not complete (Patreon in particular)
- **PPV pricing logic** has not been thoroughly tested across all platforms
- **Webhook events** are only visible in server console logs currently
- **Error handling** may be inconsistent across different features

## 📥 Feedback Submission

Please report any bugs, issues, or feature suggestions via:

- **Notion feedback form**: [Beta Tester Feedback Form](https://example.com/feedback)
- **Discord**: Tag `@support` in the #beta-testing channel

When reporting issues, please include:
- Clear steps to reproduce the problem
- Screenshots if applicable
- Browser and operating system information
- Any error messages or logs

Your feedback is invaluable in helping us improve OFAuto. Thank you for your participation! 