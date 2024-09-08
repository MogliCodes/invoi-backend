import express, { Application } from "express";
import { consola } from "consola";
import { loadEnv } from "./app/config/env.ts";
import { connectDB } from "./app/config/db.ts";
import { setupMiddleware } from "./app/middleware/middleware.ts";
import { setupSwagger } from "./app/config/swagger.ts";
import "./app/auth/strategies/local.ts";
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
import StorageController from "./domain/Storage/StorageController.ts";
import { Browser, chromium } from "playwright";

loadEnv();

const app: Application = express();
const port = process.env.PORT || 8000;
const dbUrl = process.env.DATABASE_URL || "";

const storageController = new StorageController();
storageController.getStorageInfo();

connectDB(dbUrl);
setupMiddleware(app);
setupSwagger(app);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
if (browser) {
  consola.success("Playwright browser launched");
} else {
  consola.error("Error launching playwright browser");
}

// Register routes
app.use("/restapi/auth", authRouter);
app.use("/restapi/user", userRouter);
app.use("/restapi/contact", contactRouter);
app.use("/restapi/client/projects", projectsRouter);
app.use("/restapi/client", clientRouter);
app.use("/restapi/invoice", invoiceRouter);
app.use("/restapi/settings", settingsRouter);
app.use("/restapi/storage", storageRouter);
app.use("/restapi/services", servicesRouter);
app.use("/restapi/time-records", timeRecordsRoutes);

app.listen(port, () => consola.success(`App is listening on port ${port}`));
