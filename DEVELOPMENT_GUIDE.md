# OFAuto Development Guide

## Getting Started

This guide outlines best practices and solutions to common issues when developing the OFAuto application.

## Project Structure

The project follows a Next.js structure with the following key directories:

- `/src`: Main source code
  - `/app`: Next.js app router components
  - `/components`: Reusable UI components
  - `/lib`: Core libraries and services
  - `/hooks`: React hooks
  - `/utils`: Utility functions
- `/prisma`: Database schema and migrations
- `/scripts`: Utility scripts for development
- `/public`: Static assets

## Setup and Installation

1. Clone the repository
2. Copy `.env.example` to `.env.local` and configure values
3. Run `./start-localhost.sh` to set up the database and start the development server

## Common Issues and Solutions

### Component Directory Structure

We use `/src/components` as the primary location for all components. Avoid creating components in the root `/components` directory to prevent duplication.

To detect and fix component duplications, run:

```bash
./scripts/fix-component-duplication.sh
```

### Linting Issues

To automatically fix common linting issues, run:

```bash
./scripts/fix-lint-issues.sh
```

This script will:
- Fix unescaped entities in JSX
- Add alt attributes to img elements
- Fix React hook dependency warnings
- Check for additional linting issues

### Environment Variables

Make sure your environment variables are correctly set up. To validate required environment variables:

```bash
node scripts/validate-env.js
```

### Database Connection Issues

If you encounter database connection issues, run:

```bash
./scripts/fix-db-connection.sh
```

## Best Practices

### Component Development

1. All components should be in the `/src/components` directory
2. Use the appropriate subdirectory based on component purpose
3. Create index files to export components from directories
4. Add proper TypeScript interfaces for component props

### Code Style

1. Use 'use client' at the top of client components
2. Prefer `@/` imports for internal modules
3. Use sensible named exports over default exports
4. Always include proper typing for variables and functions
5. Use meaningful variable and function names

### Database Development

1. Document changes in schema.prisma with comments
2. Create dedicated migration scripts for schema changes
3. Use proper naming conventions for tables and columns
4. Ensure proper indexing for frequently queried fields

### Testing

Before submitting a PR, run the following checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Final readiness check
./scripts/final-readiness-check.sh
```

## Deployment

Follow the instructions in `VERCEL_DEPLOYMENT_GUIDE.md` for deploying the application to Vercel.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs) 