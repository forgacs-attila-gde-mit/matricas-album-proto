FROM node:22-alpine AS build
WORKDIR /app

COPY src/MatricasAlbum.Web/package*.json ./
RUN npm ci

COPY src/MatricasAlbum.Web/ ./
RUN npm run build

FROM nginx:1.27-alpine AS final
COPY src/MatricasAlbum.Web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/matricas-album/browser /usr/share/nginx/html
EXPOSE 80
