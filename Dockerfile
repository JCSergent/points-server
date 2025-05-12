FROM node:23-alpine AS builder

WORKDIR /app/
COPY package*.json /app/

RUN npm ci --no-audit -quiet --no-progress --ignore-scripts

COPY ./ /app/ 

EXPOSE 5000
CMD ["node", "index.js"]
