FROM node:24-alpine AS build

WORKDIR /app

COPY src/frontend/package*.json ./
RUN npm ci

COPY src/frontend/. .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN adduser -S service -u 1001 -G node

# copy files from builder
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=service:node /app/.next/standalone ./
COPY --from=build --chown=service:node /app/.next/static ./.next/static
# COPY --from=build /app/package*.json ./
# COPY --from=build /app/.next ./.next
# COPY --from=build /app/public ./public
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/next.config.ts ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER service:node

CMD ["node", "server.js"]
