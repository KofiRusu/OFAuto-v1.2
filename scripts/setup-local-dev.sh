#!/bin/bash

# OFAuto Local Development Setup Script
# This script sets up the local development environment for OFAuto

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OFAuto Local Development Setup ===${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version must be 18 or higher. Current version: $NODE_VERSION${NC}"
    exit 1
fi
echo -e "✅ Node.js $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi
echo -e "✅ npm $(npm -v)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️ Docker is not installed. Some features may not work correctly.${NC}"
else
    echo -e "✅ Docker $(docker --version | cut -d ' ' -f 3 | tr -d ',')"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
fi

# Create .env.local if it doesn't exist
echo -e "\n${YELLOW}Setting up environment variables...${NC}"
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "✅ Created .env.local from .env.example"
        echo -e "${YELLOW}⚠️ Please update .env.local with your actual values before continuing${NC}"
        read -p "Press Enter to continue after updating .env.local..."
    else
        echo -e "${RED}No .env.example file found. Please create a .env.local file manually.${NC}"
        exit 1
    fi
else
    echo -e "✅ .env.local already exists"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "✅ Dependencies installed"

# Start local services with Docker
echo -e "\n${YELLOW}Starting local services with Docker...${NC}"
docker-compose up -d db redis
echo -e "✅ Local services started"

# Wait for database to be ready
echo -e "\n${YELLOW}Waiting for database to be ready...${NC}"
sleep 5

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run db:migrate
echo -e "✅ Database migrations complete"

# Seed the database
echo -e "\n${YELLOW}Seeding the database...${NC}"
npm run db:seed
echo -e "✅ Database seeded"

# Start the development server
echo -e "\n${GREEN}Setup complete! You can now start the development server with:${NC}"
echo -e "npm run dev"

echo -e "\n${GREEN}To stop the local services when you're done:${NC}"
echo -e "docker-compose down"

echo -e "\n${GREEN}Happy coding!${NC}" 