# Stage 1: Node.js Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build project (creates dist folder)
RUN npm run build

# Stage 2: Nginx to serve static files
FROM nginx:alpine

# Copy build from previous stage to Nginx folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]