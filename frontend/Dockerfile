FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SENTRY_DSN=""
ARG VITE_APP_RELEASE="production"
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_APP_RELEASE=${VITE_APP_RELEASE}
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/frontend-health || exit 1
