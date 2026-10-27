FROM node:22-alpine

WORKDIR /app

# Update CA certificates to patch system trust store
RUN apk update && apk upgrade --no-cache ca-certificates

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Persistent session directory
VOLUME ["/app/auth_session"]

ENV NODE_ENV=production

CMD ["node", "bot.js"]
