import { Request, Response, NextFunction } from "express";
import consola from "consola";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../../"); // Adjust based on depth

const LOG_DIR = path.join(projectRoot, "../logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

console.log("Logs will be saved to:", LOG_FILE);

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const logRequestBody = req.originalUrl.includes("invoice");
  const logMethod = req.method !== "GET";

  // Log request details
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    headers: req.headers,
    body: logRequestBody && logMethod ? req.body : undefined,
  };

  consola.info(`[REQUEST]`, logEntry);
  writeToFile(logEntry);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const responseLog = {
      ...logEntry,
      status: res.statusCode,
      responseTime: `${duration}ms`,
    };

    if (res.statusCode >= 400) {
      consola.warn(`[RESPONSE]`, responseLog);
    } else {
      consola.info(`[RESPONSE]`, responseLog);
    }
    writeToFile(responseLog);
  });

  next();
}

function writeToFile(log: object) {
  fs.appendFile(LOG_FILE, JSON.stringify(log) + "\n", (err) => {
    if (err) consola.error("Failed to write log to file:", err);
  });
}
