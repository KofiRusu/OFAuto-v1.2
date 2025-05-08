# OFAuto

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2FOFAuto)
[![Vercel Production Status](https://img.shields.io/github/deployments/yourusername/OFAuto/production?label=vercel%20production&logo=vercel)](https://vercel.com/yourusername/ofauto)
[![Vercel Preview Status](https://img.shields.io/github/deployments/yourusername/OFAuto/preview?label=vercel%20preview&logo=vercel)](https://vercel.com/yourusername/ofauto)

OFAuto is an automated direct message campaign tool for OnlyFans creators, enabling personalized messaging at scale.

## Features

- 🚀 Campaign Management
- 📊 Analytics Dashboard
- 📝 Template Editor
- 🔄 Automated Workflows
- 📱 Responsive Design

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript, TailwindCSS
- **UI Components**: Shadcn UI, V0.dev
- **State Management**: Zustand
- **Backend**: API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Docker (for local dev environment)
- AWS account (for cloud deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/OFAuto.git
cd OFAuto

# Install dependencies
npm install
# or
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
# or
pnpm dev
```

## Setup Guide

### Environment Variables

The project requires various environment variables to function properly. These are documented in `.env.example`. Follow these steps to set up:

1. Copy the example file:
   ```
   cp .env.example .env.local
   ```

2. Obtain required secrets:

   - **Database**: Set up a PostgreSQL database locally or use a cloud provider like AWS RDS
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/ofauto
     ```

   - **Clerk Authentication**: 
     - Sign up at [clerk.com](https://clerk.com)
     - Create a new application
     - Copy your API keys from the Clerk dashboard
     ```
     CLERK_SECRET_KEY=sk_test_...
     CLERK_PUBLISHABLE_KEY=pk_test_...
     ```

   - **Redis**: 
     - Run Redis locally with Docker: `docker run -p 6379:6379 redis`
     - Or use a cloud Redis service
     ```
     REDIS_URL=redis://localhost:6379
     ```

   - **OpenAI API Key**: 
     - Sign up at [openai.com](https://openai.com)
     - Generate an API key
     ```
     OPENAI_API_KEY=sk-...
     ```

   - **Vault (for Production)**:
     - Follow HashiCorp Vault setup guide at [vaultproject.io](https://www.vaultproject.io)
     - Set configuration variables:
     ```
     VAULT_ADDR=http://localhost:8200
     VAULT_TOKEN=hvs.your_token_here
     ```

   - **Encryption Key**: Generate a secure 32-character string for data encryption
     ```
     ENCRYPTION_KEY=your32characterstringforencryption
     ```

   - **Other Third-party Services**:
     - Configure Sentry, Elasticsearch, and platform-specific credentials as needed

3. Initialize the local database:
   ```
   npm run db:init
   ```

4. Run database migrations:
   ```
   npm run db:migrate
   ```

5. Seed the database with initial data:
   ```
   npm run db:seed
   ```

### Local Development

For local development, use the provided script to start all required services:

```bash
./start-localhost.sh
```

This script:
- Sets up required environment variables
- Starts PostgreSQL and Redis with Docker (if enabled)
- Runs Prisma migrations
- Starts the Next.js development server

### Deployment Setup

For production deployment:

1. Set up AWS infrastructure using Terraform:
   ```bash
   cd infra/terraform/environments/staging
   terraform init
   terraform apply
   ```

2. Configure GitHub Actions secrets for CI/CD:
   - `AWS_ROLE_TO_ASSUME`: ARN of the IAM role for deployment
   - `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`
   - `ENCRYPTION_KEY`
   - `OPENAI_API_KEY`
   - `ACM_CERTIFICATE_ARN` and `HOSTED_ZONE_ID`

3. Push to main branch to trigger CI/CD pipeline:
   ```bash
   git push origin main
   ```

## Deployment Guide

### Step 1: Clone the repository
```bash
git clone https://github.com/yourusername/OFAuto.git
cd OFAuto
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
# Base URLs
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Add other environment variables as needed
```

### Step 4: Run development server
```bash
npm run dev
```

### Step 5: Deploy to Vercel

#### Option 1: Using Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

#### Option 2: Using GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure your project settings
4. Deploy

## V0.dev Frontend Development

### Getting Started with V0.dev
1. Request access to [V0.dev](https://v0.dev/)
2. Install the V0 CLI:
   ```bash
   npm install -g @vercel/v0
   ```
3. Login to V0:
   ```bash
   v0 login
   ```

### Creating Components with V0
1. Describe your component:
   ```bash
   v0 "A card component for displaying campaign information with title, description, stats, and action buttons"
   ```
2. Review the generated component
3. Export and integrate into your project

### V0 Component Integration Workflow
1. Generate components using V0
2. Copy the component code
3. Add to your project under `app/components/`
4. Import and use in your pages

## Project Structure

```
OFAuto/
├── app/                  # Next.js app router
│   ├── api/              # API routes
│   ├── components/       # Reusable UI components
│   ├── dashboard/        # Dashboard pages
│   ├── campaigns/        # Campaign management pages
│   └── templates/        # Message template pages
├── lib/                  # Utility functions and shared logic
├── public/               # Static assets
├── styles/               # Global styles
├── .env.example          # Example environment variables
├── .vercelignore         # Files to ignore during Vercel deployment
└── vercel.json           # Vercel configuration
```

## Vercel Preview Deployments

Every pull request to this repository automatically triggers a preview deployment. The preview URL is added as a comment to the PR along with a deployment badge.

We have two deployment workflows available:

### Option 1: CLI-based Deployment (preview.yml)
This workflow uses the Vercel CLI directly to deploy previews:
- Configured in `.github/workflows/preview.yml`
- Deploys using direct Vercel CLI commands
- Adds a comment to your PR with preview link and badge

### Option 2: Action-based Deployment (vercel-preview.yml)
This workflow uses the Vercel GitHub Action for more features:
- Configured in `.github/workflows/vercel-preview.yml`
- Uses `amondnet/vercel-action` for deployment
- Creates sticky comments that update on each deployment
- Automatically adds a "preview" label to PRs
- Supports custom preview domains

Benefits of preview deployments:
1. Instantly see how your changes look in a production-like environment
2. Share preview links with stakeholders for feedback
3. Test all functionality before merging to main

Example PR comment with Option 1:
```markdown
## 🚀 Preview Deployment

[![Vercel Preview Deployment](https://img.shields.io/badge/vercel-deployed-brightgreen)](https://ofauto-git-feature-branch-username.vercel.app)

Your changes have been deployed to: https://ofauto-git-feature-branch-username.vercel.app
```

Example PR comment with Option 2:
```markdown
✅ **Preview Deployment Ready!**
🔗 [View Deployment](https://ofauto0-2-preview.vercel.app)
![Preview Status](https://img.shields.io/badge/vercel-deployed-brightgreen?style=flat&logo=vercel)
```

## Pull Request Workflow

When you create or update a pull request:

1. The GitHub Action defined in `.github/workflows/preview.yml` runs automatically
2. It builds and deploys your changes to a unique Vercel preview URL
3. A comment with a Vercel deployment badge and link is added to your PR
4. The preview environment includes all the features of the production environment

Example PR comment:
```markdown
## 🚀 Preview Deployment

[![Vercel Preview Deployment](https://img.shields.io/badge/vercel-deployed-brightgreen)](https://ofauto-git-feature-branch-username.vercel.app)

Your changes have been deployed to: https://ofauto-git-feature-branch-username.vercel.app
```

## Adding Vercel Badges to Pull Requests

We use GitHub Actions to automatically add Vercel deployment status and preview links to PRs. The workflow is defined in `.github/workflows/vercel-preview.yml`.

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Accessibility

OFAuto follows the Web Content Accessibility Guidelines (WCAG) 2.1 level AA standards to ensure the application is accessible to a wide range of users, including those with disabilities.

### Accessibility Guidelines

1. **Semantic HTML** - We use proper HTML elements for their intended purpose, ensuring compatibility with assistive technologies.
2. **Keyboard Navigation** - All interactive elements are accessible via keyboard, with visible focus indicators.
3. **Color Contrast** - Text and interactive elements meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text).
4. **Screen Reader Support** - ARIA attributes are used when necessary to enhance screen reader compatibility.
5. **Focus Management** - Modals and other interactive components trap focus appropriately.
6. **Responsive Design** - The application works across various devices and screen sizes.

### Testing Accessibility

We use multiple tools to ensure accessibility compliance:

1. **axe-core** - Automated testing via Storybook and CI pipeline
2. **Lighthouse** - Performance and accessibility audits
3. **Manual testing** - Keyboard navigation and screen reader testing

### Running Accessibility Tests

```bash
# Run axe accessibility tests on Storybook components
npm run test:a11y

# Run Lighthouse CI tests
npm run test:lighthouse
```

## Storybook

Storybook is used for component development and testing in isolation.

### Running Storybook Locally

```bash
# Start Storybook development server
npm run storybook
```

### Using the Accessibility Panel

1. Open any component in Storybook
2. Click on the "Accessibility" tab in the bottom panel
3. View automated accessibility checks and violations
4. Fix any issues highlighted by the accessibility tests

## Role-Based Access Control (RBAC)

OFAuto implements a comprehensive role-based access control system to manage user permissions.

### Role Hierarchy

1. **Administrator** - Full system access
2. **Manager** - Team management and analytics access
3. **Creator** - Content creation and management
4. **Viewer** - Read-only access

### Protected Routes

- `/dashboard/admin/*` - Admin only
- `/dashboard/settings/organization/*` - Admin only
- `/dashboard/reports/*` - Admin or Manager
- `/dashboard/team/*` - Admin or Manager

### CLI Commands for RBAC

```bash
# Seed initial roles
npm run seed:roles

# Create a new admin user
npm run create:admin -- --email="admin@example.com" --password="securepassword"

# List all users with roles
npm run list:users

# Update user role
npm run update:role -- --userId=123 --role="manager"
```

### Testing RBAC

The Storybook Admin Panel allows testing RBAC functionality in isolation:

1. Navigate to "Admin/RoleManagementPanel" in Storybook
2. Test creating, editing, and managing users and roles
3. Verify permission mappings and role assignments

## KYC Verification Features

The platform includes comprehensive KYC (Know Your Customer) verification capabilities:

### Latest Updates (Phase 9b)

- **KYC Review Feature:**
  - Added `reviewedAt` timestamp to track when reviews are completed
  - Renamed `notes` field to `reason` for clearer documentation
  - Improved admin review interface with timestamp display
  - Enhanced review tracking for compliance and audit purposes

### Admin Features

- Review pending KYC submissions
- Approve or reject submissions with documented reasons
- Request additional information from users
- Track review history with timestamps
- Secure file management for identification documents

### Security

- All sensitive information is encrypted
- Document storage uses secure AWS S3 with signed URLs
- Role-based access controls for admin functions
- Complete audit trail of all review actions

## Onboarding & Contracts

OFAuto includes a comprehensive e-signature contract system to facilitate legal agreements between managers and models during onboarding.

### Contract Model

The Contract model enables legal agreements between managers and models:

```prisma
model Contract {
  id                  String          @id @default(uuid())
  modelId             String          // ID of model who needs to sign
  managerId           String          // ID of manager who created the contract
  documentUrl         String          // URL to the contract document
  status              ContractStatus  @default(PENDING)
  signedAt            DateTime?       // Timestamp when contract was signed
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  model               User            @relation("ModelContracts", fields: [modelId], references: [id])
  manager             User            @relation("ManagerContracts", fields: [managerId], references: [id])
  
  @@index([modelId])
  @@index([managerId])
  @@index([status])
}

enum ContractStatus {
  PENDING
  SIGNED
  REJECTED
}
```

### API Endpoints

The contract system provides the following tRPC procedures:

1. **createContract** (Manager only)
   - Creates a new contract for a model to sign
   - Example payload:
   ```typescript
   {
     modelId: "model-user-id",
     managerId: "manager-user-id",
     documentUrl: "https://storage.example.com/contracts/agreement.pdf"
   }
   ```

2. **getContractsByModel**
   - Returns contracts associated with a model (with role-specific access control)
   - Supports filtering by status (PENDING, SIGNED, REJECTED)
   - Includes pagination

3. **getContract**
   - Retrieves details of a specific contract
   - Access restricted to the model, manager, or admin

4. **updateContractStatus**
   - Allows models to sign or reject contracts
   - Automatically sets `signedAt` timestamp when status changes to SIGNED
   - Example payload:
   ```typescript
   {
     id: "contract-id",
     status: "SIGNED"
   }
   ```

5. **getContractsByManager**
   - Returns contracts created by a manager (manager/admin access only)
   - Supports filtering and pagination

### UI Flows

The contract system includes two main UI flows:

1. **Contract Creation (Manager)**
   - Located at `/onboarding/contract`
   - Features:
     - Model selection dropdown
     - Document upload with preview
     - Form validation with Zod schemas
     - Success confirmation

2. **Contract Signing (Model)**
   - Located at `/onboarding/contract/sign/[id]`
   - Features:
     - Multi-step interface (Review → Decision → Confirmation)
     - Document preview in iframe
     - Signature confirmation with legal acknowledgment
     - Timestamp display after signing

### Security & Permissions

- Contracts are accessible only to the involved parties (model and manager) and administrators
- Only models can sign or reject their own contracts
- Managers can only create contracts where they are the manager
- Once signed or rejected, contracts cannot be modified except by administrators
- All contract operations are timestamped for audit purposes

### Testing

The contract system includes comprehensive testing:
- Unit tests for Zod schemas
- Integration tests for API endpoints
- End-to-end tests for UI flows
- Timestamp verification for signed contracts

## Platform Access

### Overview

The Platform Access feature allows managers to control which social media platforms models can access and use. This ensures appropriate oversight while giving models the flexibility they need to manage their content across approved platforms.

### For Managers

Managers can control platform access through the Platform Access Management interface:

1. Navigate to **Dashboard > Admin > Platform Access**
2. Select a model from the list on the left
3. For each platform, toggle the switch to grant or revoke access
4. Use the "Initialize Access" button to set up access records for all platforms for a new model

![Platform Access Management](https://example.com/images/platform-access-management.png)

Key features for managers:
- Granular control over which platforms each model can access
- Ability to quickly set up or revoke access
- Clear overview of all platforms associated with each model

### For Models

Models will only see and be able to use platforms that have been approved by their managers:

1. Models can view their approved platforms in **Dashboard > Platforms**
2. When scheduling posts, only approved platforms will appear in the platform selector
3. If a model needs access to additional platforms, they should contact their manager

![Model Platform View](https://example.com/images/model-platforms-view.png)

### Integration with Scheduler

The platform access controls are fully integrated with the post scheduler:

1. When models create new posts, they can only select from their approved platforms
2. Attempts to schedule posts to unapproved platforms will be blocked by the API
3. This ensures consistent access control across the entire application

![Scheduler Platform Selection](https://example.com/images/scheduler-platform-selection.png)

### Security Considerations

- Access controls are enforced at both UI and API levels
- API endpoints validate that models only access approved platforms
- All platform access changes are logged for audit purposes