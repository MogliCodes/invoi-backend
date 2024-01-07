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
import { authenticate } from "./app/middleware/auth.ts";
import { StorageController } from "./domain/Storage/StorageController.ts";
import { consola } from "consola";
import { logger } from "./app/middleware/logging.ts";

const storageController = new StorageController();
storageController.getStorageInfo();

config({ path: "../.env" });

const dbUrl: string = process.env.DATABASE_URL || "";
const app: Application = express();
const port: number = 8000;

mongoose
  .connect(dbUrl)
  .then(() => {
    consola.success("Connected to the database");
  })
  .catch((error) => {
    consola.error(new Error(error));
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

app.listen(port, () => {
  consola.success(`App is listening on port ${port}`);
});
