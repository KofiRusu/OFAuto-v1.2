#!/bin/bash
set -e

# Initialize Prisma and the database from scratch
echo "🗄️ Initializing OFAuto database from scratch..."

# Ensure we have .env file for Prisma
if [ ! -f .env ]; then
  if [ -f .env.local ]; then
    echo "Copying .env.local to .env for Prisma..."
    cp .env.local .env
  else
    echo "❌ No .env.local file found! Please create one first."
    exit 1
  fi
fi

# Load environment variables
echo "Loading environment variables..."
export $(grep -v '^#' .env | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set!"
  exit 1
fi

# Extract database name and connection info from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running on $DB_HOST. Please start PostgreSQL service."
  exit 1
fi

# Drop the database if it exists (with a safety confirmation)
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  read -p "Database '$DB_NAME' exists. Are you sure you want to drop it? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Dropping database '$DB_NAME'..."
    dropdb $DB_NAME
  else
    echo "Operation cancelled."
    exit 0
  fi
fi

# Create the database
echo "Creating database '$DB_NAME'..."
createdb $DB_NAME || {
  echo "❌ Failed to create database. Trying with superuser..."
  sudo -u postgres createdb $DB_NAME
}

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run initial migration
echo "Running initial migration..."
npx prisma migrate dev --name init

# Seed the database
echo "Seeding the database..."
npx prisma db seed

echo "✅ Database initialization complete!"
echo "You can now connect to the database using: $DATABASE_URL" 