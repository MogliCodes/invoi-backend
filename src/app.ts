import express, { Application } from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { consola } from "consola";

import authRouter from "./app/auth/AuthRoutes.ts";
import userRouter from "./domain/User/UserRoutes.ts";
import contactRouter from "./domain/Contact/ContactRoutes.ts";
import clientRouter from "./domain/Client/ClientRoutes.ts";
import projectsRouter from "./domain/Client/Projects/ProjectsRoutes.ts";
import invoiceRouter from "./domain/Invoice/InvoiceRoutes.ts";
import settingsRouter from "./domain/Settings/SettingsRoutes.ts";
import storageRouter from "./domain/Storage/StorageRoutes.ts";
import servicesRouter from "./domain/Services/ServicesRoutes.ts";
import timeRecordsRoutes from "./domain/TimeRecords/TimeRecordsRoutes.ts";
import { logger } from "./app/middleware/logging.ts";
import StorageController from "./domain/Storage/StorageController.ts";
import swaggerSpec from "./swaggerConfig.ts";
import "./app/auth/strategies/local.ts";

const app: Application = express();
const port = 8000;
const dbUrl = process.env.DATABASE_URL || "";
const storageController = new StorageController();

config({ path: "../.env" });
storageController.getStorageInfo();

mongoose
  .connect(dbUrl)
  .then(() => consola.success("Connected to the database"))
  .catch((error) => consola.error(new Error(error)));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use((req, res, next) => {
  res.locals.baseUrl = `${req.protocol}://${req.get("host")}`;
  next();
});
app.use(bodyParser.json());
app.use(cors());
app.use(logger);

app.use("/restapi/auth", authRouter);
app.use("/restapi/user", userRouter);
app.use("/restapi/contact", contactRouter);
app.use("/restapi/client/projects", projectsRouter);
app.use("/restapi/client", clientRouter);
app.use("/restapi/invoice", invoiceRouter);
app.use("/restapi/settings", settingsRouter);
app.use("/restapi/storage", storageRouter);
app.use("/restapi/services", servicesRouter);
app.use(
  "/restapi/time-records",
  passport.authenticate("local"),
  timeRecordsRoutes,
);

app.listen(port, () => consola.success(`App is listening on port ${port}`));
