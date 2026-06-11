FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN addgroup app && adduser -S app -G app
USER app
EXPOSE 5000
CMD ["node", "server.js"]