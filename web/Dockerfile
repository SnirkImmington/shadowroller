FROM node:current-alpine

WORKDIR /var/code

COPY package*.json ./
COPY tsconfig* ./
COPY .env* ./

RUN npm ci
RUN chown -R node:node node_modules

USER node

EXPOSE 3000
