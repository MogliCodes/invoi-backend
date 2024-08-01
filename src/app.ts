import express from "express";
import type { Application } from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
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
import { consola } from "consola";
import session from "express-session";
import passport from "passport";
import "./app/auth/strategies/local.ts";

const storageController = new StorageController();
const dbUrl: string = process.env.DATABASE_URL || "";
const app: Application = express();
const port: number = 8000;
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerConfig.ts";
import jwt from "jsonwebtoken";

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
app.use(
  session({
    secret: "your-secret-key", // Replace with your secret
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: false }, // If you're using HTTPS, set this to true
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use((req, res, next) => {
  res.locals.baseUrl = req.protocol + "://" + req.get("host");
  next();
});
app.use(bodyParser.json());
app.use(cors());
app.use(logger);
app.post("/restapi/auth/login", passport.authenticate("local"), (req, res) => {
  consola.success("Authenticated");
  const user: any = req.user;
  const jwtSecret = "your-secret-key";
  const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, {
    expiresIn: "1h",
  });
  res.status(200).json({
    status: 200,
    message: "Login successful",
    data: { id: user.id, username: user.username, token: token },
  });
});

app.post("/restapi/auth/logout", (req, res) => {
  // if (!req.isAuthenticated()) {
  //   res.status(401).json({ status: 401, message: "Not logged in" });
  //   return;
  // }
  req.logout((error) => {
    if (error) {
      res.status(500).json({ status: 500, message: "Error logging out" });
      return;
    }
    res.status(200).json({ status: 200, message: "Logged out" });
  });
});

app.get("/restapi/auth/status", (req, res) => {
  consola.info("Checking authentication status");
  consola.info(req.body);
  if (req.isAuthenticated()) {
    const user: any = req.user;
    const safeUser = {
      username: user.username,
      email: user.email,
      // Include other fields you want to expose
    };
    res.json({
      authenticated: true,
      user: safeUser,
    });
  } else {
    res.json({
      authenticated: false,
    });
  }
});
app.use("/restapi/user", userRouter);
app.use("/restapi/contact", contactRouter);
app.use("/restapi/client/projects", projectsRouter);
app.use("/restapi/client", clientRouter);
app.use("/restapi/invoice", invoiceRouter);
app.use("/restapi/settings", settingsRouter);
app.use("/restapi/storage", storageRouter);
app.use("/restapi/services", servicesRouter);
app.use("/restapi/time-records", timeRecordsRoutes);

app.listen(port, () => {
  consola.success(`App is listening on port ${port}`);
  consola.success(`App is listening on port ${port}`);
});
