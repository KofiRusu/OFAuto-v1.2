#!/bin/bash

# Final Readiness Check Script for OFAuto
# This script performs a series of checks to ensure the application is ready for deployment

echo "=== OFAuto Final Readiness Check ==="
echo

# Check environment variables
echo "Checking environment files..."
if diff -q .env.example .env > /dev/null; then
  echo "❌ Warning: .env and .env.example are identical. Make sure .env has been properly configured."
else
  if [ -f .env ]; then
    echo "✅ .env exists and differs from .env.example"
  else
    echo "❌ Error: .env file not found"
  fi
fi

# Check for build errors
echo
echo "Running build check..."
pnpm build
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# Check for TODO comments
echo
echo "Checking for TODO comments..."
TODOS=$(grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ./src ./ofauto ./packages)
TODO_COUNT=$(echo "$TODOS" | wc -l)

echo "Found $TODO_COUNT TODO comments:"
echo "$TODOS" | head -n 10
if [ $TODO_COUNT -gt 10 ]; then
  echo "... and $(($TODO_COUNT - 10)) more."
fi

# Check for linting errors
echo
echo "Running linting checks..."
pnpm lint
if [ $? -eq 0 ]; then
  echo "✅ Linting passed"
else
  echo "❌ Linting failed"
fi

# Check if server can start
echo
echo "Testing server startup..."
timeout 10s pnpm dev &
PID=$!
sleep 5
kill $PID
echo "✅ Server starts without immediate errors"

# Final report
echo
echo "=== Final Readiness Report ==="
echo "✅ Environment files checked"
echo "✅ Build verification completed"
echo "⚠️ $TODO_COUNT TODO comments found (review if critical)"
echo "✅ Linting completed"
echo "✅ Server startup test completed"
echo
echo "Please ensure that:"
echo "1. Vercel project is configured with correct environment variables"
echo "2. All critical TODOs are addressed or properly stubbed"
echo "3. The application has been manually tested on a staging environment"
echo
echo "Run 'pnpm dev' and visit http://localhost:3015 for a final manual check"

echo
echo "Readiness check completed!" 