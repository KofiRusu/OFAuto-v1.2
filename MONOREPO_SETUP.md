# OFAuto Monorepo Setup

This project has been restructured as a monorepo using npm workspaces for better organization and development workflow.

## Structure

```
OFAuto/
├── apps/
│   ├── backend/          # Backend API server (Port 4000)
│   └── frontend-v0/      # Frontend Next.js application (Port 3000)
├── packages/             # Shared packages (future use)
├── scripts/              # Build and utility scripts
└── package.json          # Root workspace configuration
```

## Available Scripts

### Root Level Commands
- `npm run dev:backend` - Start backend development server
- `npm run dev:frontend` - Start frontend development server  
- `npm run dev:all` - Start both backend and frontend simultaneously
- `npm run build:backend` - Build backend application
- `npm run build:frontend` - Build frontend application
- `npm run build:all` - Build both applications
- `npm run test:backend` - Run backend tests
- `npm run test:frontend` - Run frontend tests
- `npm run test:all` - Run all tests
- `npm run test:connectivity` - Test API connectivity between frontend and backend
- `npm run install:all` - Install dependencies for all workspaces

### Workspace-Specific Commands
You can run commands in specific workspaces:
- `npm run dev --workspace=apps/backend`
- `npm run build --workspace=apps/frontend-v0`
- `npm run test --workspace=apps/backend`

## Development Workflow

1. **Install Dependencies**: `npm run install:all`
2. **Start Development**: `npm run dev:all`
3. **Test Connectivity**: `npm run test:connectivity`
4. **Run Tests**: `npm run test:all`
5. **Build for Production**: `npm run build:all`

## Environment Setup

Each app maintains its own environment configuration:
- Backend: `apps/backend/.env` (PORT=4000)
- Frontend: `apps/frontend-v0/.env.local` (NEXT_PUBLIC_API_URL=http://localhost:4000)

## API Connectivity (Phase 2 Complete)

### Backend Configuration
- **Port**: 4000
- **CORS**: Enabled for `http://localhost:3000` and `http://localhost:3015`
- **Health Endpoint**: `GET /health`
- **API Routes**: `GET /api/users`

### Frontend Configuration
- **Port**: 3000 (default Next.js)
- **API URL**: `http://localhost:4000` (via environment variable)
- **Next.js Rewrites**: Configured for `/api/*` and `/trpc/*` routes
- **API Client**: Available at `src/lib/api-client.ts`

### Testing Connectivity
Run `npm run test:connectivity` to verify that:
- Backend is running on port 4000
- Frontend can reach the backend
- Health endpoint responds correctly

## Next Steps

This completes Phase 2 of the development workflow. The next phases will include:
- Phase 3: Shared types extraction
- Phase 4: Dev scripts & concurrent run optimization
- Phase 5: E2E & performance testing
- Phase 6: CI/CD & launch preparation 