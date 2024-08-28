FROM node:20-alpine

WORKDIR /app

COPY ./app/package*.json ./

RUN npm ci

COPY ./app/ .

CMD ["node", "./app/src/index.js"]