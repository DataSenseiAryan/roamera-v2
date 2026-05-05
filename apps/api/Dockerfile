FROM node:22-slim AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @roamera/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/config ./packages/config
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN pnpm --filter @roamera/api build

FROM node:22-slim AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 roamera
COPY --from=build --chown=roamera:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=roamera:nodejs /app/apps/api/package.json ./
COPY --from=build --chown=roamera:nodejs /app/node_modules ./node_modules
RUN mkdir -p data && chown roamera:nodejs data
USER roamera
EXPOSE 3000
CMD ["node", "dist/index.js"]
