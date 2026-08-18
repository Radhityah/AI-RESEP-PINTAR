# ── ResepPintar API — Express JS + Swagger ──
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY src ./src

EXPOSE 4000
CMD ["node", "src/index.js"]