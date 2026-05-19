FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

EXPOSE 3000

WORKDIR /app/backend
CMD ["node", "server.js"]