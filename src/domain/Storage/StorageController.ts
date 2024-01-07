import { StorageClient } from "@supabase/storage-js";
import { config } from "dotenv";
import { consola } from "consola";
config();
// const STORAGE_URL = process.env.SUPABASE_URL || "";
// const SERVICE_KEY = process.env.SUPABASE_API_KEY || "";
const STORAGE_URL = "https://dpoohyfcotuziotpwgbf.supabase.co/storage/v1";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export class StorageController {
  public async getStorageInfo() {
    try {
      const storageClient = new StorageClient(STORAGE_URL, {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      });
      consola.success("Successfully created storage client");
    } catch (error) {
      consola.error(new Error("Error creating storage client"));
    }
  }
}
