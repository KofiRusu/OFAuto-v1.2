# Vercel Deployment Guide

This guide provides detailed instructions for deploying OFAuto to Vercel and setting up GitHub integration for continuous deployment.

## Connecting to GitHub

1. Log in to your [Vercel account](https://vercel.com/login)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

## Environment Variables

Set up the following environment variables in your Vercel project settings:

```
NEXT_PUBLIC_API_URL=your_api_url_here
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_deployed_url
# Add any other required environment variables
```

## Deployment Types

### Production Deployment

Production deployments occur automatically when you push to your main branch. These deployments use your production environment variables.

### Preview Deployments

Preview deployments are created automatically when you:
1. Open a pull request
2. Push to any non-main branch 

Preview deployments use the same environment variables as production but can be overridden in project settings.

## Adding Deployment Badges to GitHub

Add these badges to your README.md to show deployment status:

```markdown
[![Vercel Production Deployment](https://img.shields.io/github/deployments/yourusername/OFAuto/production?label=vercel%20production&logo=vercel&logoColor=white)](https://ofauto.vercel.app)
[![Vercel Preview Deployment](https://img.shields.io/github/deployments/yourusername/OFAuto/Preview?label=vercel%20preview&logo=vercel&logoColor=white)](https://ofauto-git-preview-yourusername.vercel.app)
```

Replace `yourusername` with your GitHub username and update the URLs to match your actual deployment URLs.

## Automatic GitHub Preview Comments

Vercel automatically adds deployment preview links as comments to pull requests. This feature is enabled by default when you connect your GitHub repository.

## Troubleshooting Deployments

If you encounter deployment issues:

1. Check the build logs in Vercel
2. Verify your environment variables are set correctly
3. Ensure your `.vercelignore` file is properly configured
4. Check that your project meets Vercel's requirements for Next.js deployments

## Local Development vs. Vercel

Some differences to be aware of:

1. Environment variables: Local uses `.env.local`, Vercel uses the dashboard
2. Build process: Vercel optimizes builds differently than your local environment
3. Serverless functions: Local development may use different execution contexts
4. Edge functions: Some features may behave differently when deployed

## Useful Commands

```bash
# Deploy to Vercel from CLI
vercel

# Deploy to production
vercel --prod

# Link local project to Vercel project
vercel link
```

## Further Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/solutions/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli) 