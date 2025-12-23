# Use the official Node.js 18 (LTS) image as the base
FROM node:18-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first 
# This allows Docker to cache your dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Start the bot
CMD [ "node", "index.js" ]