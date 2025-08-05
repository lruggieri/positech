# Stage 1: Build
FROM --platform=${TARGETPLATFORM:-linux/amd64} node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM --platform=${TARGETPLATFORM:-linux/amd64} node:20-alpine AS production

WORKDIR /app

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# Copy built assets and package files from the build stage
COPY --from=build --chown=sveltekit:nodejs /app/build ./build
COPY --from=build --chown=sveltekit:nodejs /app/package.json ./package.json
COPY --from=build --chown=sveltekit:nodejs /app/package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm ci --omit=dev

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER sveltekit

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["node", "build/index.js"]