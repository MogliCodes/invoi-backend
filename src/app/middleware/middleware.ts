import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { logger } from "./logging.ts";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { consola } from "consola";

export const setupMiddleware = (app: express.Application) => {
  app.use(
    session({
      secret: process.env.SECRET_KEY || "",
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

  // Apply isAuthenticated middleware to all routes except auth routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/restapi/auth")) {
      return next();
    }
    return isAuthenticated(req, res, next);
  });
};

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const jwtSecret = process.env.SECRET_KEY || "";
  const authHeader = req.headers.authorization;
  const userId = req.headers.userid;
  if (authHeader && userId) {
    let token;
    if (authHeader.includes("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    } else {
      token = authHeader;
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        consola.error(err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (decoded && (decoded as jwt.JwtPayload).id === userId) {
        return next();
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
