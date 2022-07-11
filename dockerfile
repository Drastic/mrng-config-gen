FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
ENV APP_PORT=8000
RUN npm install
COPY ./src /usr/src/app
EXPOSE 8000
CMD ["node", "index.js"]