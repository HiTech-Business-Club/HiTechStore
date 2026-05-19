FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl wget

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production --legacy-peer-deps

WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

EXPOSE 3000

USER node

CMD ["node", "server.js"]