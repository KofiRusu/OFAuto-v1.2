# OFAuto Backend System

This document provides an overview of the backend system for OFAuto, a comprehensive content management and automation platform designed for content creators.

## Architecture Overview

The backend system follows a modern architecture with the following key components:

1. **Next.js API Routes**: Serverless functions that handle API requests
2. **Prisma ORM**: For database interactions and type-safe queries
3. **Clerk Authentication**: For secure user authentication and management
4. **PostgreSQL Database**: For storing application data
5. **Redis**: For caching and rate limiting

## Core Features

- **User Authentication**: Secure login and registration using Clerk
- **Client Management**: Add and manage clients/creators
- **Platform Integration**: Connect to multiple social media platforms
- **Content Scheduling**: Schedule and publish content across platforms
- **Metrics Tracking**: Track engagement and financial metrics
- **Secure Credential Management**: Encrypted storage of platform credentials

## API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]`: Authentication handlers using Clerk

### Clients
- `GET /api/clients`: Get all clients for the authenticated user
- `POST /api/clients`: Create a new client
- `GET /api/clients/:id`: Get specific client details
- `PUT /api/clients/:id`: Update client information
- `DELETE /api/clients/:id`: Delete a client

### Platforms
- `GET /api/platforms`: Get all platforms for the authenticated user
- `POST /api/platforms`: Add a new platform integration
- `GET /api/platforms/:id`: Get specific platform details
- `PUT /api/platforms/:id`: Update platform information
- `DELETE /api/platforms/:id`: Delete a platform integration
- `POST /api/platforms/:id/credentials`: Add credentials for a platform
- `DELETE /api/platforms/:id/credentials`: Remove credentials for a platform

### Content
- `GET /api/posts`: Get all scheduled posts
- `POST /api/posts`: Schedule a new post
- `GET /api/posts/:id`: Get specific post details
- `PUT /api/posts/:id`: Update post information
- `DELETE /api/posts/:id`: Delete a scheduled post
- `POST /api/posts/:id/publish`: Manually publish a post

### Metrics
- `GET /api/metrics/engagement`: Get engagement metrics
- `GET /api/metrics/financial`: Get financial metrics

## Security Features

1. **Encrypted Credentials**: Platform credentials are encrypted using AES-256-GCM
2. **Middleware Protection**: Authentication and authorization middleware
3. **Audit Logging**: Comprehensive logging of sensitive operations
4. **Input Validation**: Zod schema validation for all API inputs
5. **Rate Limiting**: Protection against brute force attacks

## Development Setup

1. **Environment Setup**:
   ```
   cp .env.example .env.local
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Database Setup**:
   ```
   npm run db:init
   ```

4. **Start Development Server**:
   ```
   npm run dev
   ```

## Testing

1. **Run Tests**:
   ```
   npm test
   ```

2. **Test Coverage**:
   ```
   npm run test:coverage
   ```

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following main models:

- User: Application users
- Client: Creator accounts being managed
- Platform: Social media platform integrations
- ScheduledPost: Content to be published
- EngagementMetric: Track engagement data
- FinancialMetric: Track financial data
- AuditLog: Security audit trail

## Deployment

The application can be deployed using Docker. See the Docker configuration files for details:
- `Dockerfile`: Main production container
- `docker-compose.yml`: Multi-container setup including database and Redis

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is prohibited. 