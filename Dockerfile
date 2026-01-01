# -------- Builder stage (has dev deps + types) --------
FROM node:18-alpine AS builder
WORKDIR /app

# Install all deps (including devDependencies)
COPY backend/package*.json ./
RUN npm ci

# Copy source + tsconfig and compile
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Keep your original approach: install TS globally then compile
RUN npm install -g typescript && tsc

# -------- Runtime stage (production deps only) --------
FROM node:18-alpine
WORKDIR /app

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output (wherever tsc put it) + any needed runtime files
# We copy the whole /app from builder, then remove the builder's node_modules
COPY --from=builder /app/ /app/
RUN rm -rf node_modules && npm ci --omit=dev

# Optional, but harmless
ENV NODE_ENV=production

# Start: prefer common build outputs; fall back to npm start if needed.
CMD ["sh", "-c", "\
  if [ -f dist/index.js ]; then node dist/index.js; \
  elif [ -f build/index.js ]; then node build/index.js; \
  elif [ -f src/index.js ]; then node src/index.js; \
  else npm start; fi \
"]
