# Vercel + GitHub Integration Guide

This guide explains how to set up Vercel's GitHub integration for deployment previews and status badges.

## Setting Up GitHub Integration with Vercel

1. **Connect your GitHub repository to Vercel**:
   - From your Vercel dashboard, click "Add New" → "Project"
   - Select your GitHub repository
   - Follow the setup wizard to complete the integration

2. **Enable GitHub Deployments API**:
   - In your Vercel project settings, navigate to "Git Integration"
   - Ensure "GitHub Deployments API" is enabled
   - This allows Vercel to communicate deployment statuses back to GitHub

## Adding Vercel Deployment Badges to GitHub

Add these badges to your README.md to show deployment status:

```markdown
[![Vercel Production Deployment](https://img.shields.io/github/deployments/kofirusu/OFAuto/production?label=vercel%20production&logo=vercel&logoColor=white)](https://ofauto.vercel.app/)
[![Vercel Preview Deployment](https://img.shields.io/github/deployments/kofirusu/OFAuto/Preview?label=vercel%20preview&logo=vercel&logoColor=white)](https://ofauto-git-main.vercel.app/)
```

## Setting Up Preview Comments in Pull Requests

Vercel automatically adds preview deployment links to your GitHub pull requests when properly configured:

1. **Enable GitHub Pull Request integration**:
   - In your Vercel project settings, navigate to "Git Integration"
   - Make sure "GitHub Pull Request Comments" is enabled
   - This lets Vercel comment on your PRs with preview links

2. **Use Preview Deployments in your workflow**:
   - When you create a PR, Vercel automatically creates a preview deployment
   - The preview link will be commented on your PR
   - Anyone with the link can see the preview without authentication

## Best Practices

1. **Branch Protection Rules**:
   - Set up GitHub branch protection rules to require successful Vercel deployments before merging PRs
   - This ensures code that breaks your build doesn't get merged

2. **Environment Variables**:
   - Keep environment-specific variables separate in Vercel
   - Configure different environment variables for Production and Preview deployments

3. **Custom Domains**:
   - Set up custom domains for production deployments
   - You can also set up preview.yourdomain.com for preview deployments

4. **Notifications**:
   - Configure Vercel notification settings to receive alerts about successful/failed deployments 