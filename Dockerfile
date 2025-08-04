# ========================
# Multi-stage Dockerfile for ClockPilot
# ========================

# ========================
# Stage 1: Dependencies
# ========================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# ========================
# Stage 2: Builder
# ========================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ========================
# Stage 3: Production
# ========================
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 clockpilot && \
    adduser --system --uid 1001 clockpilot

# Install runtime dependencies and security tools
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client \
    tzdata \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy production dependencies
COPY --from=deps --chown=clockpilot:clockpilot /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=clockpilot:clockpilot /app/dist ./dist
COPY --from=builder --chown=clockpilot:clockpilot /app/package*.json ./

# Copy necessary files
COPY --chown=clockpilot:clockpilot drizzle.config.ts ./
COPY --chown=clockpilot:clockpilot shared ./shared

# Create uploads directory
RUN mkdir -p uploads && chown clockpilot:clockpilot uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Advanced health check with multiple endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/health/ready && \
        curl -f http://localhost:5000/api/health/live || exit 1

# Switch to non-root user
USER clockpilot

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# ========================
# Labels for metadata
# ========================
LABEL maintainer="ClockPilot Team <admin@clockpilot.com>"
LABEL version="1.0.0"
LABEL description="ClockPilot - Employee Time Management System"
LABEL org.opencontainers.image.title="ClockPilot"
LABEL org.opencontainers.image.description="Employee Time Management System"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="ClockPilot"
LABEL org.opencontainers.image.licenses="MIT"