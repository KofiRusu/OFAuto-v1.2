# Vercel Deployment Guide for OFAuto

This guide provides step-by-step instructions for deploying OFAuto to Vercel, setting up automatic deployments, and configuring environment variables.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your OFAuto repository on GitHub

## Initial Setup

### 1. Connect Your Repository to Vercel

1. Log in to [Vercel](https://vercel.com) and click "Add New..."
2. Select "Project"
3. Import your OFAuto GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm install

### 2. Configure Environment Variables

Add all required environment variables from your `.env.example` file:

1. In Vercel, navigate to your project
2. Go to "Settings" > "Environment Variables"
3. Add all necessary variables from your `.env.example` file, using appropriate values for production
4. For sensitive values, use [Vercel's encryption features](https://vercel.com/docs/concepts/projects/environment-variables#securing-environment-variables)

### 3. Deploy Your Project

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once complete, you'll receive a URL for your deployed application

## Setting Up GitHub Integration

### 1. Automatic Deployments

Vercel automatically sets up the following for your project:

- **Production Deployment**: Every push to the `main` branch will trigger a production deployment
- **Preview Deployments**: Every pull request will generate a unique preview URL

### 2. Add Deployment Badges to Your README

Update your README.md with deployment status badges:

1. Go to GitHub repository > Actions
2. Find your Vercel deployment workflows
3. Click on the "..." menu and copy the status badge Markdown
4. Paste into your README.md file

Alternatively, use these templates (replace `YOUR_USERNAME` with your GitHub username):

```markdown
[![Vercel Production Deployment](https://github.com/YOUR_USERNAME/OFAuto/actions/workflows/production.yml/badge.svg)](https://github.com/YOUR_USERNAME/OFAuto/actions/workflows/production.yml)

[![Vercel Preview Deployment](https://github.com/YOUR_USERNAME/OFAuto/actions/workflows/preview.yml/badge.svg)](https://github.com/YOUR_USERNAME/OFAuto/actions/workflows/preview.yml)
```

## Setting Up Custom GitHub Actions (Optional)

For more control over your deployment process, create a custom GitHub Action:

1. Create `.github/workflows/vercel-deploy.yml` in your repository:

```yml
name: Vercel Deployment
on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          vercel-args: ${{ github.event_name == 'push' && '--prod' || '' }}
```

2. Add the following secrets to your GitHub repository:
   - `VERCEL_TOKEN`: Your Vercel personal access token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

## Troubleshooting

### Build Failures

If your build fails:

1. Check the build logs in Vercel for specific errors
2. Ensure all required environment variables are set
3. Verify your project builds locally with `npm run build`
4. Check that all dependencies are properly listed in `package.json`

### Environment Variable Issues

If you're experiencing issues with environment variables:

1. Ensure all required variables are added to Vercel
2. Check for any typos in variable names
3. Verify that the values are correct for your production environment
4. For database connections, ensure your database allows connections from Vercel's IP ranges

## Advanced Configuration

### Custom Domains

To add a custom domain to your Vercel deployment:

1. Go to your project in Vercel
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the verification steps

### Serverless Functions

OFAuto uses Next.js API routes which are deployed as serverless functions on Vercel. Keep in mind:

1. Serverless functions have a maximum execution time
2. Cold starts may affect performance for infrequently accessed functions
3. Consider using edge functions for location-sensitive operations

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions) 