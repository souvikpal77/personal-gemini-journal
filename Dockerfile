# Multi-stage production Dockerfile for Google Cloud Run
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies for building
RUN npm ci

# Copy full application source
COPY . .

# Build Vite client and bundle server with esbuild into dist/
ENV NODE_ENV=production
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled production bundle from builder
COPY --from=builder /app/dist ./dist

# Cloud Run injects the PORT environment variable at container startup
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
