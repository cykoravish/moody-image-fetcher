# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port Nginx is listening on
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
