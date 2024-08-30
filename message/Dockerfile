FROM node:20-alpine

WORKDIR /message

COPY ./message/package*.json ./

RUN npm ci

COPY ./message/ .