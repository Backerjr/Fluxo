# Multi-stage build for Fluxo production deployment

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN pnpm build

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fluxo

# Copy built application
COPY --from=builder --chown=fluxo:nodejs /app/dist ./dist
COPY --from=builder --chown=fluxo:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fluxo:nodejs /app/package.json ./package.json
COPY --from=builder --chown=fluxo:nodejs /app/drizzle ./drizzle

# Create log directory
RUN mkdir -p /var/log/fluxo && chown fluxo:nodejs /var/log/fluxo

# Switch to non-root user
USER fluxo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
