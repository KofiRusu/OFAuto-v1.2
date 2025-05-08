# Database Migrations Guide

This document outlines how to manage database migrations for the OFAuto project.

## Overview

OFAuto uses Prisma ORM to manage database schema changes. Migrations are version-controlled and applied programmatically to ensure consistency across environments.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Prisma CLI (installed with project dependencies)

## Migration Workflow

### 1. Local Development

#### Creating Initial Migration

To create the initial migration from your Prisma schema:

```bash
npx prisma migrate dev --name init
```

This command will:
- Generate SQL based on your schema changes
- Apply the migration to your local database
- Generate the Prisma client

#### Making Schema Changes

When you update the `prisma/schema.prisma` file:

1. Create a migration with a descriptive name:
   ```bash
   npx prisma migrate dev --name add_user_profile
   ```

2. Prisma will generate SQL and apply it automatically
3. Review the generated migration files in `prisma/migrations/`

#### Testing Migrations

Before committing migrations, you should test them:

```bash
# Reset your database and apply migrations from scratch
npm run db:reset

# Or apply pending migrations only
npx prisma migrate deploy
```

#### Handling Schema Drift

If your database schema and Prisma schema get out of sync:

```bash
# Reset your database
npm run db:reset

# Or use Prisma's reset command
npx prisma migrate reset
```

### 2. Continuous Integration

In CI environments, always use `migrate deploy` instead of `migrate dev`:

```bash
npx prisma migrate deploy
```

This applies any pending migrations without generating new ones.

### 3. Production Deployment

Migrations to production should always be reviewed carefully:

1. Never use `--force` flag in production environments
2. Include in CI/CD pipelines before deploying the application
3. Always have a backup of the database before migration

## Migration Directory Structure

```
prisma/
├── migrations/          # Contains all migration files
│   ├── 20250419131350_init/
│   │   ├── migration.sql  # SQL for this migration
│   │   └── ...
│   └── migration_lock.toml  # Ensures migration integrity
├── schema.prisma         # Prisma schema definition
└── seed.ts               # Seed data for development
```

## Best Practices

1. **Naming Conventions**: Use descriptive names for migrations (e.g., `add_user_roles`, `update_client_schema`)

2. **Schema First**: Always modify the Prisma schema first, then create migrations

3. **Small, Focused Migrations**: Break down large schema changes into smaller, more manageable migrations

4. **Testing**: Test migrations on a copy of production data before applying to production

5. **Rollback Plan**: Always have a rollback plan for production migrations
   ```bash
   # You can create a backup before migration
   pg_dump -U username -d database_name > backup.sql
   ```

6. **Version Control**: Always commit migration files to your repository

7. **Seeding Development Data**: Use `prisma db seed` for development data, not migrations

## Handling Migration Failures

If a migration fails:

1. Review the error message for clues about the failure
2. Fix the issue in your Prisma schema
3. Create a new migration rather than modifying existing ones

For production failures:
1. Restore from backup if needed
2. Fix the issue and create a new migration
3. Consider a maintenance window for complex migrations

## Environment-specific Considerations

### Development
- Use `migrate dev` for creating migrations
- Use `db:reset` to start fresh when needed

### CI/CD Pipeline
- Use `migrate deploy` to apply migrations
- Include migration step before deploying application

### Staging
- Mirror production process exactly
- Test migrations thoroughly before production deployment

### Production
- Use `migrate deploy` only
- Always backup before migration
- Consider maintenance window for major changes

## Monitoring Migrations

To check the status of migrations:

```bash
npx prisma migrate status
```

To view your database with Prisma Studio:

```bash
npx prisma studio
``` 