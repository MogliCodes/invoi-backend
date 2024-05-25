// import { StorageClient } from "@supabase/storage-js";
import { config } from "dotenv";
import { consola } from "consola";
import * as Minio from "minio";
import fs from "fs";

config();

export default class StorageController {
  public async getStorageInfo() {
    try {
      const ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
      const SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
      const ENDPOINT = process.env.MINIO_ENDPOINT || "";
      const PORT = parseInt(process.env.MINIO_PORT || "9000");
      const minioClient = new Minio.Client({
        endPoint: ENDPOINT,
        port: PORT,
        useSSL: false,
        accessKey: ACCESS_KEY,
        secretKey: SECRET_KEY,
      });
      const buckets = await minioClient.listBuckets();
      consola.success(
        `Successfully established connection to Minio at ${ENDPOINT}:${PORT}`,
      );
      consola.info("Buckets", buckets);
      try {
        const __dirname = new URL(".", import.meta.url).pathname;
        // Get a file as test buffer to upload
        const file = fs.readFileSync(`${__dirname}/test.txt`);
        await minioClient.putObject("invoices", "test.txt", file);
      } catch (error) {
        consola.error(error);
      }
      return minioClient;
    } catch (error: any) {
      consola.error(error);
    }
  }

  public static async createStorageClient() {
    try {
      const ACCESS_KEY = "ezi9yqfqBBdjCUdMOUf8";
      const SECRET_KEY = "39kAuhmqNeHAD4rE6IaQMNzOBkUHdKmH09XVKHkU";
      return new Minio.Client({
        endPoint: "127.0.0.1",
        port: 9000,
        useSSL: false,
        accessKey: ACCESS_KEY,
        secretKey: SECRET_KEY,
      });
    } catch (error: any) {
      consola.error(error);
    }
  }
}
