FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Persistent session directory
VOLUME ["/app/auth_session"]

ENV NODE_ENV=production

CMD ["npm", "start"]
