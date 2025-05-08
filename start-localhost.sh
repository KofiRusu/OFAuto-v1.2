#!/bin/bash
set -e

echo "🚀 Starting OFAuto localhost environment..."

# Function to create default .env.local file
create_default_env_file() {
  echo "Creating default .env.local file..."
  cat > .env.local << EOF
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
EOF

  # Also create an .env file for Prisma
  echo "Creating .env file for Prisma..."
  cp .env.local .env
}

# 1. Ensure .env.local exists
if [ ! -f .env.local ]; then
  echo "No .env.local file found."
  
  # Try to get from Vercel if available
  if command -v npx &> /dev/null && command -v vercel &> /dev/null; then
    echo "Trying to pull environment variables from Vercel..."
    if npx vercel env pull .env.local; then
      echo "✅ Successfully pulled environment variables from Vercel."
      cp .env.local .env
    else
      echo "⚠️ Could not pull from Vercel, creating default .env.local"
      create_default_env_file
    fi
  else
    echo "Vercel CLI not found, creating default .env.local"
    create_default_env_file
  fi
else
  echo "Found existing .env.local file."
  # Also create an .env file for Prisma
  echo "Copying to .env for Prisma..."
  cp .env.local .env
fi

# 2. Validate environment
echo "Validating environment..."
if ! node scripts/validate-env.js; then
  echo "❌ Environment validation failed!"
  exit 1
fi

# 3. Check PostgreSQL is running
if ! command -v pg_isready &> /dev/null; then
  echo "❌ PostgreSQL client tools not found. Please install PostgreSQL."
  exit 1
fi

if ! pg_isready > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
  exit 1
fi

# Source environment variables
source .env

# 4. Setup database if needed
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo "Database '$DB_NAME' does not exist. Setting up..."
  ./scripts/setup-local-db.sh
else
  echo "Database '$DB_NAME' exists, checking migrations..."
  # Copy .env.local to .env for Prisma to read it
  cp .env.local .env
  npx prisma migrate deploy
fi

# 5. Ensure npm dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# 6. Start the development server
echo "🚀 Starting Next.js development server on http://localhost:3015"
npm run dev 