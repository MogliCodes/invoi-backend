import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "backend.invoi.app",
      version: "1.0.0",
      description: "API documentation for backend.invoi.app",
    },
  },
  apis: ["./**/*Routes.ts", "./**/*Controller.ts"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
