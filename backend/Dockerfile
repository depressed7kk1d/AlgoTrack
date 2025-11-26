FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma (Debian-based)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (excluding node_modules from host)
COPY src ./src/
COPY nest-cli.json tsconfig.json .eslintrc.js .prettierrc ./

# Build
RUN npm run build

# Clean dev dependencies
RUN npm prune --production

EXPOSE 3001

CMD ["npm", "run", "start:prod"]


