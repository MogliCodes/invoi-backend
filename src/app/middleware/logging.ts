import { Request, Response, NextFunction } from "express";
import consola from "consola";

// Middleware to log request details
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Flag to indicate if additional logging is required
  const logRequestBody = req.originalUrl.includes("invoice");

  // Log request details
  if (logRequestBody) {
    consola.info(`Request Body: ${JSON.stringify(req.body)}`);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log response details
    consola.info(
      `${new Date().toISOString()} ${req.method} ${
        req.originalUrl
      } ${JSON.stringify(req.params)} ${JSON.stringify(req.query)} ${
        res.statusCode
      } ${duration}ms`,
    );
  });

  next();
}
