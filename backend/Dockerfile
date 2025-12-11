FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
