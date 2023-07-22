import express from "express";
import type { Application } from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRouter from "./app/auth/AuthRoutes.ts";
import userRouter from "./domain/User/UserRoutes.ts";
import clientRouter from "./domain/Client/ClientRoutes.ts";
import invoiceRouter from "./domain/Invoice/InvoiceRoutes.ts";
import { authenticate } from "./app/middleware/auth.ts";
import { StorageController } from "./domain/Storage/StorageController.ts";

const storageController = new StorageController();
storageController.getStorageInfo();

config();

const dbUrl: string = process.env.DATABASE_URL || "";
const app: Application = express();
const port: number = 8000;
mongoose.connect(dbUrl);

app.use(bodyParser.json());

app.get("/test", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", authenticate, userRouter);
app.use("/api/client", authenticate, clientRouter);
app.use("/api/invoices", authenticate, invoiceRouter);

app.listen(port, () => {
  console.log(`App is listening on port ${port} !`);
});
