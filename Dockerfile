FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create data directory with proper permissions
RUN mkdir -p data && chown -R node:node data

# Create backups directory with proper permissions
RUN mkdir -p backups && chown -R node:node backups

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "src/index.js" ]