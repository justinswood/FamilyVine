# Build stage
FROM node:18 as build

WORKDIR /app

# Build argument for API URL
ARG REACT_APP_API=http://localhost:5050
ENV REACT_APP_API=$REACT_APP_API

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config for React Router
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Health check - verify nginx is serving content
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]