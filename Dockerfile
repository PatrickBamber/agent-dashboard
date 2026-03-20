# =============================================================================
# Dockerfile.agent-dashboard — Agent KPI Dashboard
# =============================================================================
# Multi-stage build: deps → build → runtime
#
# Session data: bind mount ~/.openclaw/agents/main/sessions/sessions.db
# to /data/sessions.db in the container
#
# Build:
#   cd ~/Developer/agent-dashboard
#   docker build -t agent-dashboard:latest .
#
# Run:
#   docker run -d -p 3001:3001 \
#     -v ~/.openclaw/agents/main/sessions/sessions.db:/data/sessions.db:ro \
#     --name agent-dashboard \
#     agent-dashboard:latest
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Install ALL deps (including devDependencies — needed for vite build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy everything for the build
COPY . .

# Build React frontend with vite
RUN npx vite build

# ---------------------------------------------------------------------------
# Stage 2: Runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Rebuild better-sqlite3 for this Alpine environment
RUN npm rebuild better-sqlite3 --build-from-source

# Copy server (plain JS, already compiled from TypeScript)
COPY server/ ./server/

# Copy built frontend from build stage
COPY --from=build /app/dist ./public

# Session data directory (bind mount from host)
RUN mkdir -p /data

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
