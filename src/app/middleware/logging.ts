import { Request, Response, NextFunction } from "express";
import consola from "consola";

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
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
