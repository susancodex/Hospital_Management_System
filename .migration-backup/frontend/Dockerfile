# Frontend build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tailwind.config.js postcss.config.mjs vite.config.js tsconfig*.json* ./
COPY src ./src
COPY index.html ./

# Install and build
RUN npm ci && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Serve the frontend
CMD ["serve", "-s", "dist", "-l", "5173"]
