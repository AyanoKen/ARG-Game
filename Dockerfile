# Use the official Node.js image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . /usr/src/app

# Expose the port your application will run on
EXPOSE 5000

# Command to run your application
CMD ["node", "server.js"]