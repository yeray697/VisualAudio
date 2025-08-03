FROM node:24-alpine AS build

WORKDIR /app

COPY src/frontend/package*.json ./
RUN npm ci

COPY src/frontend/. .

RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

RUN adduser -S service -u 1001 -G node

COPY --from=build --chown=service:node /app/.next/standalone ./
COPY --from=build --chown=service:node /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER service:node

CMD ["node", "server.js"]
