# Use an official Node.js runtime as the base image
FROM node:18

ENV DATABASE_URL=mongodb://127.0.0.1:27017/invoi?retryWrites=false&w=majority
# Install PNPM globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

COPY . .
# Install app dependencies using PNPM
RUN pnpm install && pnpm build

# Copy the rest of the application code

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["pnpm", "run", "start"]
