# -------------------------------
# Stage 1: Install dependencies
# -------------------------------
  FROM node:20-alpine AS deps

  # Ensure core packages for builds are installed
  RUN apk add --no-cache libc6-compat
  
  WORKDIR /app
  
  # Copy package files and install dependencies
  COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
  
  # Preferably use the same package manager you use locally
  RUN if [ -f package-lock.json ]; then npm ci --only=production; \
      elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
      elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
      else echo "No lockfile found." && exit 1; fi
  
  
  # -------------------------------
  # Stage 2: Build application
  # -------------------------------
  FROM node:20-alpine AS builder
  
  WORKDIR /app
  
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  
  # Build Next.js for production
  RUN npm run build
  
  
  # -------------------------------
  # Stage 3: Production image
  # -------------------------------
  FROM node:20-alpine AS runner
  
  WORKDIR /app
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # Install only production dependencies
  COPY --from=deps /app/node_modules ./node_modules
  
  # Copy build output
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package.json ./package.json
  
  # Use non-root user for security
  RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
  USER nextjs
  
  # Expose the port
  EXPOSE 3000
  
  # Start Next.js
  CMD ["npm", "start"]
