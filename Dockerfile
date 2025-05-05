FROM node:22-alpine
WORKDIR /app

# Install everything, including ts-node
COPY package*.json ./
RUN npm install

# Copy your source
COPY . .

# Start the bot
CMD ["npm", "start"]