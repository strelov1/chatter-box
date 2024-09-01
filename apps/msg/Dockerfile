FROM node:20-alpine AS builder

WORKDIR /app

RUN npm i -g turbo

COPY ./ .

RUN turbo prune msg --docker


FROM node:20-alpine AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ .

RUN npm ci

COPY --from=builder /app/out/full/ .

CMD ["node", "./apps/msg/src/index.js"]