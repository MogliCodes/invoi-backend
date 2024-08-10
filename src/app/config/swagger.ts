import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../../swaggerConfig.js";
import { Application } from "express";

export const setupSwagger = (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
