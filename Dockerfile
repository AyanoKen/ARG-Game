# Use base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application code to the container
COPY . .

# Expose port
EXPOSE 3000

# Command to run application
CMD ["node", "server.js"]