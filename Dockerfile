# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20.11.1

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get({host:'127.0.0.1',port:3000,path:'/health',timeout:2000},res=>{res.statusCode===200?process.exit(0):process.exit(1)});req.on('error',()=>process.exit(1));req.end();"
USER node
EXPOSE 3000
CMD ["node", "dist/main"]

