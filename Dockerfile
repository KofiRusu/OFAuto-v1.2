# Base stage for dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Add build arguments
ARG NPM_FLAGS="--legacy-peer-deps"

# Install dependencies with flags from build arg
COPY package.json package-lock.json ./
RUN npm ci ${NPM_FLAGS}

# Set up development dependencies in a separate stage
FROM node:18-alpine AS builder
WORKDIR /app

# Add build arguments
ARG NPM_FLAGS="--legacy-peer-deps"
ARG NODE_ENV=production

# Environment variables
ENV NODE_ENV=${NODE_ENV}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy built artifacts
FROM node:18-alpine AS runner
WORKDIR /app

# Add curl for healthchecks
RUN apk --no-cache add curl

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# Expose the port
EXPOSE 3000

# Configure healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"] 