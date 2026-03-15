# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine3.19 AS deps

WORKDIR /app

# Copy manifest files first — layer cache: npm ci only reruns when these change
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev


# ── Stage 2: Lean runtime image ────────────────────────────────────────────────
FROM node:20-alpine3.19

# Non-root user — never run app as root in production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what the app needs at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/

# Accept build-time metadata injected by the CI pipeline
ARG GIT_SHA=local
ARG BUILD_DATE=local
ENV GIT_SHA=${GIT_SHA} \
    BUILD_DATE=${BUILD_DATE}

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
