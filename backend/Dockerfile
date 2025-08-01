# Use a stable Node image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies before copying the whole app
COPY package*.json ./
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy the rest of the app AFTER dependencies
COPY . .

# Expose port (optional, if not already published via docker-compose)
EXPOSE 5000

# Start the dev server with nodemon
CMD ["npm", "run", "dev"]
