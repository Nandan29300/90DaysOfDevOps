# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
# Use the full Node image to install packages (including native addons if needed)
FROM node:20-alpine3.19 AS deps

WORKDIR /app

# Copy only package files first — layer cache: npm install only reruns
# when package.json or package-lock.json changes, NOT on every code change
COPY package.json package-lock.json* ./

# Install production dependencies only (skip devDependencies like nodemon)
RUN npm ci --omit=dev


# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
# Tiny Alpine base — same OS as stage 1 so native modules are compatible
FROM node:20-alpine3.19

# Best Practice: create a non-root user so the app never runs as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from the deps stage (no compiler needed here)
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/

# Set correct ownership for the non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Document the port the app listens on
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]

# ─────────────────────────────────────────────────────────────────────────────
# Expected final image size: ~120–140 MB (node:20-alpine base + node_modules)
# No devDependencies, no build tools, no unnecessary files
# ─────────────────────────────────────────────────────────────────────────────
