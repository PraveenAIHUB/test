# Property Pro - OCI-ready image (frontend + backend)
# Build: docker build -t property-pro .
# Run:   docker run -p 3000:3000 --env-file backend/.env property-pro

# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY frontend/ .
ENV VITE_API_BASE_URL=
RUN npm run build

# ---- Stage 2: Backend + serve frontend ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./../frontend/dist

EXPOSE 3000
CMD ["node", "server.js"]
