# ===================================================
# STAGE 1 : BUILDER
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --frozen-lockfile

COPY src/ ./src/

# ===================================================
# STAGE 2 : RUNNER
# ===================================================
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner

LABEL org.opencontainers.image.title="kubernetes-lab-api"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.description="API REST fil rouge — Formation K3s"

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src          ./src
COPY --from=builder /app/package.json ./

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"]

USER nonroot

CMD ["src/index.js"]