# OFAuto Developer Guide

This document provides comprehensive technical documentation for developers working on the OFAuto platform. The document covers platform integrations, AI reasoning models, UI components, testing strategy, and deployment.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Platform Integrations](#platform-integrations)
  - [Existing Integrations](#existing-integrations)
  - [Adding New Integrations](#adding-new-integrations)
  - [Authentication Flows](#authentication-flows)
- [AI Reasoning Model](#ai-reasoning-model)
  - [How It Works](#how-it-works)
  - [Extending Capabilities](#extending-capabilities)
  - [Prompt Engineering](#prompt-engineering)
- [UI Components](#ui-components)
  - [Dark/Light Mode Implementation](#darklight-mode-implementation)
  - [Component Structure](#component-structure)
- [Testing Suite](#testing-suite)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [E2E Tests](#e2e-tests)
- [Security Considerations](#security-considerations)
  - [Credential Encryption](#credential-encryption)
  - [Client Ownership Verification](#client-ownership-verification)
- [DevOps Setup](#devops-setup)
  - [Environment Variables](#environment-variables)
  - [Deployment Process](#deployment-process)
- [Further Development](#further-development)

## Architecture Overview

OFAuto is built using the following technologies:

- **Frontend**: Next.js 13+ (App Router), React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **API Layer**: tRPC with Zod validation
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk for user authentication
- **AI Integration**: OpenAI API

The application follows a modular architecture:

```
src/
├── app/             # Next.js App Router pages
├── components/      # React components
├── lib/             # Shared libraries and utilities
│   ├── auth/        # Authentication utilities
│   ├── platforms/   # Platform clients (OnlyFans, Patreon, etc.)
│   ├── services/    # Domain services (Reasoning, Analytics)
│   ├── trpc/        # tRPC routers
│   ├── prisma.ts    # Prisma client
│   ├── security.ts  # Encryption utilities
│   └── logger.ts    # Logging utilities
└── styles/          # Global styles
```

## Platform Integrations

### Existing Integrations

The platform currently supports the following integrations:

- **OnlyFans** - via username/password
- **Patreon** - via OAuth
- **Ko-fi** - via API key
- **Fansly** - via username/password
- **Gumroad** - via API key
- **Twitter** - via OAuth + API key/secret
- **Instagram** - via OAuth

Each integration is implemented as a client class in `src/lib/platforms/` that handles API communication with the respective platform.

### Adding New Integrations

To add a new platform integration:

1. **Update the PlatformType enum**:
   ```typescript
   // In src/lib/trpc/routers/platformConnections.ts
   const platformTypeSchema = z.enum([
     'patreon', 'kofi', 'fansly', 'onlyfans', 'gumroad', 'twitter', 'instagram',
     'new-platform', // Add your new platform here
   ]);
   ```

2. **Create validation schema**:
   ```typescript
   // Define the schema for your platform's credentials
   const connectNewPlatformSchema = baseConnectSchema.extend({
     platformType: z.literal('new-platform'),
     // Add required fields for authentication
     apiKey: z.string().min(1, "API key cannot be empty"),
     // ... other fields as needed
   });
   ```

3. **Add connection procedure to tRPC router**:
   ```typescript
   // In platformConnectionsRouter
   connectNewPlatform: protectedProcedure
     .input(connectNewPlatformSchema)
     .mutation(async ({ ctx, input }) => {
       const { userId } = ctx;
       const { clientId, platformType, apiKey } = input;
       
       return connectPlatform({
         clientId,
         platformType,
         credential: { apiKey },
         userId,
       });
     }),
   ```

4. **Create platform client class**:
   ```typescript
   // src/lib/platforms/new-platform.ts
   export class NewPlatformClient {
     // Implementation...
   }
   ```

5. **Update UI components**:
   - Add to the `PLATFORMS` array in `ConnectedAccountsSection.tsx`
   - Add form in `ConnectPlatformModal.tsx`
   - Add icon for the platform

### Authentication Flows

The platform supports three primary authentication flows:

1. **API Key** (Ko-fi, Gumroad): Simple form to collect and store API key
2. **Username/Password** (OnlyFans, Fansly): Form to collect credentials, which are encrypted
3. **OAuth** (Patreon, Twitter, Instagram): Redirect to platform for authentication, collect tokens

For implementing OAuth:

1. Create API route for OAuth initialization:
   ```typescript
   // src/app/api/connect/[platform]/route.ts
   export async function GET(req: NextRequest) {
     // Generate OAuth URL and redirect
   }
   ```

2. Create callback handler:
   ```typescript
   // src/app/api/connect/[platform]/callback/route.ts
   export async function GET(req: NextRequest) {
     // Handle OAuth callback, store tokens
   }
   ```

## AI Reasoning Model

### How It Works

The AI reasoning model (`src/lib/services/reasoningService.ts`) provides AI-powered insights and recommendations based on user data. The process:

1. **Gather Context**: Collect relevant data from the database (metrics, performance data)
2. **Generate Prompt**: Format the data into a prompt for the AI
3. **Call OpenAI API**: Send the prompt to the AI model
4. **Process Response**: Parse and structure the AI's response
5. **Store Insight**: Save the insight to the database

### Extending Capabilities

To add a new insight type:

1. **Update the InsightType enum**:
   ```typescript
   export enum InsightType {
     // ... existing types
     NEW_INSIGHT_TYPE = 'new-insight-type',
   }
   ```

2. **Add prompt template**:
   ```typescript
   private generatePrompt(context: InsightContext, insightType: InsightType): string {
     const prompts: Record<InsightType, string> = {
       // ... existing prompts
       [InsightType.NEW_INSIGHT_TYPE]: `
         Based on the following data, provide recommendations for...
         
         ${JSON.stringify(context.relevantData)}
         
         Provide specific recommendations...
       `,
     };
     // ...
   }
   ```

3. **Update UI components**:
   - Add to the `insightTypes` array in `InsightsSection.tsx`
   - Add a description in `getInsightTypeDescription`

### Prompt Engineering

The effectiveness of the AI insights depends on well-crafted prompts. Guidelines:

- Be specific about the type of recommendations you want
- Include relevant context data in a structured format
- Ask for specific output formats (e.g., bullet points, numbered steps)
- Set clear constraints and expectations
- Provide examples of good outputs in the prompt

## UI Components

### Dark/Light Mode Implementation

Dark/light mode is implemented using Tailwind CSS and a theme provider:

1. **Theme Provider** (`src/components/providers/ThemeProvider.tsx`):
   - Manages theme state (dark/light/system)
   - Persists theme preference in localStorage
   - Applies appropriate CSS classes to the document

2. **Theme Toggle** (`src/components/ui/theme-toggle.tsx`):
   - UI component for switching themes
   - Dropdown with options for dark, light, or system preference

3. **CSS Variables** (`src/app/globals.css`):
   - Defines color variables for light and dark modes
   - Uses CSS variables for consistent theming across components

To use the theme in components:

```tsx
// A component that respects the theme
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Content
</div>
```

### Component Structure

UI components follow a hierarchical structure:

- **Page Components**: Full pages in `src/app/**`
- **Section Components**: Major sections like `ConnectedAccountsSection`
- **Feature Components**: Specific features like `ConnectPlatformModal`
- **UI Components**: Reusable UI elements from Shadcn/UI

When creating new components:

1. Place them in the appropriate directory:
   - `/components/dashboard/` for dashboard sections
   - `/components/ui/` for reusable UI elements
   - `/components/[feature]/` for feature-specific components

2. Follow the naming conventions:
   - Use PascalCase for component names
   - Add `Section` suffix for major dashboard sections
   - Add `Modal` suffix for modal components

3. Implement consistent props and styling:
   - Accept `className` prop for customizing styles
   - Use Tailwind's dark mode utilities for theme support
   - Keep components responsive with Tailwind's responsive classes

## Testing Suite

### Unit Tests

Unit tests focus on testing individual components and functions in isolation.

Running unit tests:
```bash
npm run test
# or with watch mode
npm run test:watch
```

Creating a new unit test:
```typescript
// src/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

Writing integration tests:
```typescript
// Example of testing a form submission flow
test('form submission saves data and displays success message', async () => {
  render(<FormComponent />);
  
  // Interact with the form
  await userEvent.type(screen.getByLabelText('Name'), 'Test User');
  await userEvent.click(screen.getByText('Submit'));
  
  // Verify success message appears
  expect(await screen.findByText('Success')).toBeInTheDocument();
});
```

### E2E Tests

End-to-end tests are implemented using Cypress and test the application as a whole.

Running E2E tests:
```bash
# Start the application in development mode
npm run dev

# In another terminal, run Cypress tests
npm run cypress
# or in headless mode
npm run cypress:headless
```

Cypress tests are located in `cypress/e2e/` and follow this pattern:
```typescript
// cypress/e2e/platform-connection.cy.ts
describe('Platform Connection Flow', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });

  it('should connect a platform', () => {
    // Test steps...
  });
});
```

## Security Considerations

### Credential Encryption

Platform credentials are encrypted before storage:

1. **Encryption Process** (`src/lib/security.ts`):
   - Uses AES-256-GCM encryption
   - Stores credentials as encrypted data + IV + auth tag
   - Encryption key is stored in environment variables

2. **Security Best Practices**:
   - Never log credentials or tokens
   - Implement strict input validation
   - Use encrypted storage for all sensitive data
   - Implement token refresh for OAuth platforms

### Client Ownership Verification

All API endpoints verify that the user has access to the requested client:

1. **Verification Function** (`src/lib/auth/verifyClientOwnership.ts`):
   ```typescript
   export async function verifyClientOwnership(userId: string, clientId: string): Promise<void> {
     const client = await prisma.client.findFirst({
       where: {
         id: clientId,
         userId: userId,
       },
     });

     if (!client) {
       throw new TRPCError({
         code: 'FORBIDDEN',
         message: 'You do not have access to this client',
       });
     }
   }
   ```

2. **Usage in tRPC Procedures**:
   ```typescript
   someOperation: protectedProcedure
     .input(z.object({ clientId: z.string() }))
     .mutation(async ({ ctx, input }) => {
       const { userId } = ctx;
       const { clientId } = input;
       
       // Verify client ownership
       await verifyClientOwnership(userId, clientId);
       
       // Proceed with operation...
     }),
   ```

## DevOps Setup

### Environment Variables

Required environment variables:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ofauto"

# Security
PLATFORM_CREDENTIAL_SECRET="your-64-character-hex-key"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# AI
OPENAI_API_KEY=""

# Platforms
PATREON_CLIENT_ID=""
PATREON_CLIENT_SECRET=""
PATREON_REDIRECT_URI=""

TWITTER_CLIENT_ID=""
TWITTER_CLIENT_SECRET=""
TWITTER_CALLBACK_URL=""

INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""
INSTAGRAM_REDIRECT_URI=""
```

For local development, create a `.env.local` file with these variables.

### Deployment Process

1. **Vercel Deployment**:
   - Connect GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Set up automatic deployments for main branch

2. **Database Setup**:
   - Use a managed PostgreSQL provider (e.g., Supabase, Neon)
   - Run migrations before deployment: `npx prisma migrate deploy`

3. **CI/CD Pipeline**:
   - Run tests before deployment
   - Ensure environment variables are properly set

## Further Development

Areas for future development:

1. **Analytics Dashboard**: Enhanced analytics with drill-down capabilities
2. **Content Management**: Direct upload and management of content
3. **Advanced AI Features**: More sophisticated AI capabilities
4. **Additional Platforms**: Support for more monetization platforms
5. **Compliance Tools**: Features to help creators stay compliant with platform policies

To contribute to development:

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request with clear description

---

This guide is continuously updated as the platform evolves. For questions or contributions, please contact the development team. 