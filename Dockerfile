# Dockerfile — web service (slim, no Playwright browsers)
# Used by the main Railway web service: Next.js app + API routes.
#
# Playwright-dependent scraper sources are handled by the dedicated
# scraper service (Dockerfile.scraper), which runs on a separate schedule.
# All web-process scrape calls respect SCRAPER_NO_PLAYWRIGHT=true:
#   - Shopify sources:      work normally (pure HTTP)
#   - WooCommerce sources:  use Store API only; skip Playwright fallback
#   - Squarespace sources:  use ?format=json only; skip Playwright fallback

FROM node:18-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
# Playwright browsers are not installed here — tell scrapers not to attempt launch
ENV SCRAPER_NO_PLAYWRIGHT=true

EXPOSE 3000

CMD ["npm", "run", "start"]
