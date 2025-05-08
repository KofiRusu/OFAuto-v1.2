#!/bin/bash
set -e

echo "🗄️ Setting up local PostgreSQL database for OFAuto..."

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
else
  echo "⚠️ .env.local file not found!"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set!"
  exit 1
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "Database name from URL: $DB_NAME"

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
  exit 1
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo "Creating database '$DB_NAME'..."
  createdb $DB_NAME || {
    echo "❌ Failed to create database. Trying with superuser..."
    sudo -u postgres createdb $DB_NAME
  }
else
  echo "Database '$DB_NAME' already exists."
fi

# Copy .env.local to .env for Prisma to read it
echo "Copying .env.local to .env for Prisma..."
cp .env.local .env

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate dev --name init

# Seed the database with test data
echo "Seeding database with test data..."
npx prisma db seed

echo "✅ Database setup complete!"
echo "You can now connect to the database using: $DATABASE_URL" 