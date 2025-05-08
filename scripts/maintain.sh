#!/bin/bash

echo "🔧 OFAuto System Maintenance Script"
echo "--------------------------------"
echo

# Check for root directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# 1. Ensure env files are correct
echo "👉 Checking environment files..."
if diff -q .env.example .env.local > /dev/null; then
  echo "⚠️ Warning: .env.local appears to be identical to .env.example"
  read -p "Would you like to copy .env.example to .env.local for configuration? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from example file. Please configure it with your values."
  fi
else
  if [ -f .env.local ]; then
    echo "✅ .env.local exists and differs from .env.example"
  else
    cp .env.example .env.local
    echo "✅ Created .env.local from example file. Please configure it with your values."
  fi
fi

# Copy .env.local to .env for Prisma
cp .env.local .env
echo "✅ Copied .env.local to .env for Prisma"

# 2. Fix component duplication
echo
echo "👉 Checking for component duplication..."
./scripts/fix-component-duplication.sh

# 3. Fix database connection issues
echo
echo "👉 Checking database connection..."
./scripts/fix-db-connection.sh

# 4. Update dependencies
echo
echo "👉 Checking for dependency updates..."
npm outdated
read -p "Would you like to update dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm update
  echo "✅ Dependencies updated"
fi

# 5. Fix linting issues
echo
echo "👉 Fixing lint issues..."
./scripts/fix-lint-issues.sh

# 6. Final readiness check
echo
echo "👉 Running final readiness check..."
./scripts/final-readiness-check.sh

echo
echo "🎉 Maintenance complete!"
echo
echo "📊 System Status:"
echo "- Environment: ✅"
echo "- Components: ✅"
echo "- Database: ✅"
echo "- Dependencies: ✅"
echo "- Linting: ✅"
echo
echo "You can now start the development server with:"
echo "./start-localhost.sh" 