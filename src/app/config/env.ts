import { config } from "dotenv";

export const loadEnv = () => {
  config({ path: "../.env" });
};
