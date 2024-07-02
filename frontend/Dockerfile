# Build the Angular App
FROM node:22-alpine3.19 as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
COPY . ./
RUN ls
RUN npm run build

# Serve these static files with NGINX.
FROM nginx:1.21.6-alpine
COPY --from=build /app/dist/rodan/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]