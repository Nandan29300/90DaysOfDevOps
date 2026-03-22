# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine3.19 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Lean runtime image ────────────────────────────────────────────────
FROM node:20-alpine3.19
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/

ARG GIT_SHA=local
ARG BUILD_DATE=local
ARG APP_VERSION=1.0.0
ENV GIT_SHA=${GIT_SHA} BUILD_DATE=${BUILD_DATE} APP_VERSION=${APP_VERSION}

RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
