# --- builder ---
FROM node:18-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm install -g typescript && tsc

# Detect compiled entry and store it
RUN node -e "const fs=require('fs'); \
  const c=['dist/index.js','build/index.js','lib/index.js','out/index.js','src/index.js']; \
  const f=c.find(p=>fs.existsSync(p)); \
  if(!f){console.error('No compiled JS entry found. Check tsconfig outDir/noEmit.'); process.exit(1);} \
  fs.writeFileSync('/app/.entry', f); console.log('Using entry:', f);"

# --- runtime ---
FROM node:18-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output + entry marker from builder
COPY --from=builder /app/ /app/

# Ensure runtime deps are prod-only
RUN rm -rf node_modules && npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=8080

CMD ["sh", "-c", "node $(cat /app/.entry)"]
