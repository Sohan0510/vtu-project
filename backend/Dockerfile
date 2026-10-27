FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Default port
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
