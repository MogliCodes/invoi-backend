import express from "express";
import type { Application } from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRouter from "./app/auth/AuthRoutes.ts";
import userRouter from "./domain/User/UserRoutes.ts";
import { authenticate } from "./app/middleware/auth.ts";

config();

const app: Application = express();
const port: number = 8000;
mongoose.connect(process.env.DATABASE_URL || "");

app.use(bodyParser.json());
app.use("/api/auth", authRouter);
app.use("/api/user", authenticate, userRouter);

app.listen(port, () => {
  console.log(`App is listening on port ${port} !`);
});
