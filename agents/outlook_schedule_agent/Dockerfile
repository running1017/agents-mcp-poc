FROM node:24-alpine

WORKDIR /app

# Install dependencies for hot reload
RUN npm install -g nodemon tsx

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY src ./src

# Expose port
EXPOSE 8000

# Start with hot reload using tsx watch
CMD ["npm", "run", "dev"]
