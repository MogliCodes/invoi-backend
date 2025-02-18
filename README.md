# backend.invoi.app
This repository holds the code for the backend of my personal invoicing app. The app is built with Node.js, Express.js, and MongoDB.

Furthermore, these are the main technologies used in this project:
- [mongoose](https://mongoosejs.com/)
- [passport](http://www.passportjs.org/)
- [minio](https://min.io/)
- [playwright](https://playwright.dev/)

Playwright is used to make PDF screenshots of invoices. Minio is used to store the PDFs.

## A little bit of context
This is the third version of the project and I have been tempted to rewrite it from scratch again multiple times. The first time I started the project I did not really know anything about backend development and was following along tutorials. Which means that a lot of choices for the fundemental technologies were not really thought through. 

If I would start this project again, I would choose a lot of different technologies. But I am not going to do that. I am going to stick with these technologies, since the project works 

## Prerequisites

- Git
- Node.js >=20 <21
- pnpm
- Docker
- MongoDB

## Usage
### Local development
In order to be able to run the backend locally you need a MongoDB and Minio instance. MongoDB is connected via a connection string which you need to set in your `.env` file. The environment variables are defined in the `.env.example` file.

The easiest way to run Minio is in a Docker Container. Depending on your platform there are different ways to install Minio. 

- [Docker](https://hub.docker.com/r/minio/minio)
- [Minio](https://min.io/docs/minio/container/index.html)

**Install depedencies**
```sh
pnpm install
```

**Start the development server**
```sh
pnpm dev:watch
```


### Running in production
To run the app in production you need to build it and choose a way to run it a s a Node.js process. The project contains a pm2 configuration file which can be used to run the app as a process.

**Build the app**
```sh
pnpm build
```
**Start the app**
```sh
pm2 start ecosystem.config.js