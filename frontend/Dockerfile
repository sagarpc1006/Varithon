# ===================================================
# Stage 1: Build React Production Artifacts
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications and install with clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ===================================================
# Stage 2: Serve via Lightweight Nginx Container
# ===================================================
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
