FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json dulu supaya cache optimal
COPY package*.json ./

# Install semua dependencies (termasuk devDependencies untuk build)
RUN npm install

COPY . .

EXPOSE 4000

# Default command untuk production
CMD ["npm", "start"]
