# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

COPY . .

# Install app dependencies using PNPM
RUN pnpm install && pnpm build


# Copy the rest of the application code

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["pnpm", "run", "start"]
