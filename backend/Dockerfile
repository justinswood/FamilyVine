FROM node:18-alpine

# Install curl for healthcheck and production dependencies
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies as root
RUN npm ci --only=production && \
    npm rebuild sharp --platform=linux --arch=x64 && \
    npm cache clean --force

# Copy application files
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads uploads/gallery uploads/hero && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check - checks if server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["node", "app.js"]
