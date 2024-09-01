FROM node:20-alpine

WORKDIR /gms

COPY ./gms/package*.json ./

RUN npm ci

COPY ./gms/ .