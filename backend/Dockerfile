# base image
FROM node:20-alpine

# set workdir
WORKDIR /app

# copy package files
COPY package*.json ./

# install dependencies
RUN npm install --legacy-peer-deps \
    && npm install -g @nestjs/cli

# copy everything
COPY . .

RUN apk add --no-cache python3 make g++ netcat-openbsd dos2unix \
    && npm rebuild bcrypt --build-from-source

# fix line endings and make wait script executable
RUN dos2unix /app/wait.sh && chmod +x /app/wait.sh

# build app
RUN npm run build

EXPOSE 3002
# Start NestJS directly - TypeORM will handle DB connection retries
CMD ["npm", "run", "start:prod"]
