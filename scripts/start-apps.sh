#!/bin/bash

echo "🚀 Starting OFAuto development servers..."

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "ts-node-dev" || true
pkill -f "next dev" || true

# Wait for processes to stop
sleep 2

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
cd apps/backend && npx prisma generate || true
cd ../..

# Start backend
echo "🔧 Starting backend server..."
cd apps/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check backend health
node scripts/test-connectivity.js
if [ $? -ne 0 ]; then
    echo "❌ Backend failed to start properly"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd apps/frontend-v0
npm run dev &
FRONTEND_PID=$!
cd ../..

echo "✅ All services started!"
echo "   Backend: http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait