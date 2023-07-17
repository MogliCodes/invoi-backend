import { config } from "dotenv";
import pg from "pg";
const { Pool } = pg;

config();

export const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, // Use this option only for local development/testing
  },
});
