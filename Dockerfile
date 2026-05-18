FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y chromium libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libxshmfence1 libxfixes3 libx11-6 libx11-xcb1 libxcb1 libxext6 libxi6 libxtst6 libglib2.0-0 libdbus-1-3 libexpat1 fonts-liberation wget ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"]
