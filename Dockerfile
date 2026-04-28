FROM node:20-alpine AS deps
RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
RUN apk update && apk upgrade --no-cache
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV MONGODB_URI="mongodb://dummy"
ENV NEXTAUTH_SECRET="dummy_secret"

RUN npm run build

FROM node:20-alpine AS runner
RUN apk update && apk upgrade --no-cache

RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm \
    && rm -f /usr/local/bin/npx \
    && rm -rf /opt/yarn* \
    && rm -f /usr/local/bin/yarn \
    && rm -f /usr/local/bin/yarnpkg

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]