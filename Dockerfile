FROM node:16-alpine

WORKDIR /root/

COPY package.json yarn.lock ./

RUN yarn install --production=true

COPY ./dist ./dist/
EXPOSE 8080
USER node

COPY .env ./

CMD [ "yarn", "start" ]