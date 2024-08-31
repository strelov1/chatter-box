FROM node:20-alpine

WORKDIR /wss

COPY ./wss/package*.json ./

RUN npm ci

COPY ./wss/ .

CMD ["node", "./wss/src/index.js"]