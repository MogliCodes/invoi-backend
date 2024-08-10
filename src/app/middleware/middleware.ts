import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { logger } from "./logging.ts";

export const setupMiddleware = (app: express.Application) => {
  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(bodyParser.json());
  app.use(cors());
  app.use(logger);

  // Set base URL
  app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get("host")}`;
    next();
  });
};
