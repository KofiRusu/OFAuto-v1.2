#!/bin/bash
set -e

echo "🔧 Fixing common database connection issues..."

# 1. Ensure environment variables are available to Prisma
if [ -f .env.local ]; then
  echo "Copying .env.local to .env for Prisma..."
  cp .env.local .env
else
  echo "⚠️ No .env.local file found! Creating a default one..."
  cat > .env.local << 'EOL'
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ofauto_dev

# Clerk Auth (Development Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_test
CLERK_SECRET_KEY=sk_test_test
CLERK_WEBHOOK_SECRET=whsec_test

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3015
NODE_ENV=development

# Development Flags
ENABLE_MOCK_PLATFORMS=true
DISABLE_RATE_LIMITS=true
LOG_LEVEL=debug
MOCK_AI_RESPONSES=true
EOL
  echo "Created default .env.local file"
  cp .env.local .env
fi

# Source the environment variables
source .env

# 2. Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in .env file!"
  exit 1
fi

# 3. Extract database info
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"

# 4. Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running on $DB_HOST."
  echo "Please start PostgreSQL service before continuing."
  exit 1
fi
echo "✅ PostgreSQL is running."

# 5. Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo "⚠️ Database '$DB_NAME' does not exist. Creating it..."
  createdb $DB_NAME || {
    echo "❌ Failed to create database. Trying with superuser..."
    sudo -u postgres createdb $DB_NAME || {
      echo "❌ Failed to create database with superuser."
      echo "Please create the database manually with: createdb $DB_NAME"
      exit 1
    }
  }
  echo "✅ Database created."
else
  echo "✅ Database '$DB_NAME' exists."
fi

# 6. Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# 7. Check if migrations exist
if [ ! -d "prisma/migrations" ]; then
  echo "⚠️ No migrations found. Creating initial migration..."
  npx prisma migrate dev --name init
else
  echo "Applying migrations..."
  npx prisma migrate deploy
fi

echo "✅ Database connection issues fixed!"
echo "You can now start the localhost environment with: ./start-localhost.sh" 