FROM node:20-alpine

WORKDIR /auth

COPY ./auth/package*.json ./

RUN npm ci

COPY ./auth/ .

CMD ["node", "./auth/src/index.js"]