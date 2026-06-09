# -----------------------------------------------------------------------------
# Stage 1: Build the React Application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json* ./

# Install dependencies (using clean install for reliable builds)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Serve the application with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 internally
EXPOSE 80

# Note: We use the default nginx configuration here because the main routing
# and security headers are handled by the central Nginx API Gateway container.
CMD ["nginx", "-g", "daemon off;"]
