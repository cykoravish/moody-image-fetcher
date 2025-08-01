# Use a stable Node image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Start the Vite server with --host to expose it
CMD ["npm", "run", "dev", "--", "--host"]
