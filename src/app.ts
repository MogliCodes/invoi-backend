import express from "express";
import type { Application } from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./app/auth/AuthRoutes.ts";
import userRouter from "./domain/User/UserRoutes.ts";
import contactRouter from "./domain/Contact/ContactRoutes.ts";
import clientRouter from "./domain/Client/ClientRoutes.ts";
import invoiceRouter from "./domain/Invoice/InvoiceRoutes.ts";
import settingsRouter from "./domain/Settings/SettingsRoutes.ts";
import storageRouter from "./domain/Storage/StorageRoutes.ts";
import servicesRouter from "./domain/Services/ServicesRoutes.ts";
import { authenticate } from "./app/middleware/auth.ts";
import StorageController from "./domain/Storage/StorageController.ts";
import { consola } from "consola";
import { logger } from "./app/middleware/logging.ts";

const storageController = new StorageController();
const dbUrl: string = process.env.DATABASE_URL || "";
const app: Application = express();
const port: number = 8000;
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerConfig.ts";

config({ path: "../.env" });
storageController.getStorageInfo();

mongoose
  .connect(dbUrl)
  .then(() => {
    consola.success("Connected to the database");
  })
  .catch((error) => {
    consola.error(new Error(error));
  });

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use((req, res, next) => {
  res.locals.baseUrl = req.protocol + "://" + req.get("host");
  next();
});
app.use(bodyParser.json());
app.use(cors());
app.use(logger);
app.use("/restapi/auth", authRouter);
app.use("/restapi/user", authenticate, userRouter);
app.use("/restapi/contact", authenticate, contactRouter);
app.use("/restapi/client", authenticate, clientRouter);
app.use("/restapi/invoice", invoiceRouter);
app.use("/restapi/settings", settingsRouter);
app.use("/restapi/storage", storageRouter);
app.use("/restapi/services", servicesRouter);

app.listen(port, () => {
  consola.success(`App is listening on port ${port}`);
});
