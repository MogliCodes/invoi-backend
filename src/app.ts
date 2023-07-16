import express, { Application, Request, Response } from "express";
import { config } from "dotenv";
import pg from "pg";
const { Pool } = pg;

config();

const app: Application = express();

const port: number = 8000;

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, // Use this option only for local development/testing
  },
});

app.get("/test", (req: Request, res: Response) => {
  res.send(pool);
});

app.get("/test-db-connection", async (req: Request, res: Response) => {
  try {
    // Test the database connection
    await pool.query("SELECT 1");

    // Connection successful
    res.status(200).json({ message: "Database connection test successful" });
  } catch (error) {
    console.error("Error testing database connection:", error);
    res.status(500).json({ error: "Failed to connect to the database" });
  }
});

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
