FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production
COPY src ./src
EXPOSE 3005
CMD ["node", "src/index.js"]