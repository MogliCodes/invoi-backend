import { NextFunction, Request, Response } from "express";
import { consola } from "consola";

export function logger(req: Request, res: Response, next: NextFunction) {
  consola.info(`${req.method} ${req.path} ${JSON.stringify(req.params)}`);
  next();
}
