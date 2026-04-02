FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Provide dummy env vars so Next.js build succeeds (real values come at runtime)
ENV DATABASE_URL=file:./data/build.db
ENV AUTH_SECRET=build-only-dummy
ENV NEXTAUTH_SECRET=build-only-dummy
ENV AUTH_TRUST_HOST=true

# Create dummy DB with schema so prerendering pages can query it
RUN mkdir -p data && npx drizzle-kit push
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat libstdc++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p data public/uploads/artworks public/uploads/forms public/uploads/pages data/backups
COPY scripts/backup.sh /app/scripts/backup.sh
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/backup.sh /app/scripts/entrypoint.sh
RUN echo "0 3 * * * /bin/sh /app/scripts/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/nextjs

RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs data public/uploads .next/cache

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
