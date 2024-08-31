FROM node:20-alpine

WORKDIR /msg

COPY ./msg/package*.json ./

RUN npm ci

COPY ./msg/ .