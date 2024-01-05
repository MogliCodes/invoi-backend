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
import { authenticate } from "./app/middleware/auth.ts";
import { StorageController } from "./domain/Storage/StorageController.ts";

const storageController = new StorageController();
storageController.getStorageInfo();

config({ path: "../.env" });

const dbUrl: string = process.env.DATABASE_URL || "";
const app: Application = express();
const port: number = 8000;

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });

app.use(bodyParser.json());
app.use(cors());
app.use("/restapi/auth", authRouter);
app.use("/restapi/user", authenticate, userRouter);
app.use("/restapi/contact", authenticate, contactRouter);
app.use("/restapi/client", authenticate, clientRouter);
app.use("/restapi/invoice", invoiceRouter);

app.listen(port, () => {
  console.log(`App is listening on port ${port} !`);
});
