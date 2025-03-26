FROM node:16

WORKDIR /app

COPY package*.json ./
COPY server.js ./

RUN npm install

COPY backend ./backend

# 環境変数を設定
ENV PORT=5000
ENV NODE_ENV=production
ENV MONGODB_URI=mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster
ENV DB_SERVER_TIMEOUT_MS=30000
ENV DB_SOCKET_TIMEOUT_MS=45000
ENV DB_CONNECT_TIMEOUT_MS=30000
ENV DB_MAX_POOL_SIZE=10

# ポート5000を開放
EXPOSE 5000

CMD [ "npm", "start" ]
