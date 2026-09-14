# Прод-образ ASHYQ (DEPLOY-PREP-001): standalone-сборка Next.js, без node_modules в образе.
# Сборка: docker build --build-arg NEXT_PUBLIC_SITE_URL=https://ЗАМЕНИТЬ-ДОМЕН -t ashyq .
# Запуск: docker run -d -p 3000:3000 --env-file .env.production -v ashyq-data:/data ashyq
# Подробности и чек-лист — docs/DEPLOY.md.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* вшиваются в JS при сборке, поэтому задаются здесь, а не при запуске
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ASHYQ_WHATSAPP=77067080181
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ASHYQ_WHATSAPP=$NEXT_PUBLIC_ASHYQ_WHATSAPP \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ASHYQ_LEADS_DIR=/data
# заявки и журнал доставки — на отдельном томе, чтобы переживать пересборку образа
RUN mkdir /data && chown node:node /data
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "server.js"]
