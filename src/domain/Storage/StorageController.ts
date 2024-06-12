import { Request, Response } from "express";
import { config } from "dotenv";
import { consola } from "consola";
import * as Minio from "minio";
import fs from "fs";
import { Error } from "mongoose";
import { BucketItem } from "minio";

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
        consola.error('Error uploading test file to "invoices" bucket');
        consola.error(error);
      }
      return minioClient;
    } catch (error) {
      consola.error("Error establishing connection to Minio");
      consola.error(error);
    }
  }

  public static async createStorageClient() {
    try {
      const ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
      const SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
      const ENDPOINT = process.env.MINIO_ENDPOINT || "";
      const PORT = parseInt(process.env.MINIO_PORT || "9000");
      return new Minio.Client({
        endPoint: ENDPOINT,
        port: PORT,
        useSSL: false,
        accessKey: ACCESS_KEY,
        secretKey: SECRET_KEY,
      });
    } catch (error) {
      consola.error(error);
    }
  }

  public async listAllBuckets(req: Request, res: Response) {
    try {
      const minioClient = await StorageController.createStorageClient();
      if (!minioClient) return new Error("Minio client not found");
      const buckets = await minioClient.listBuckets();
      res.status(200).json({ message: "listAllBuckets", data: buckets });
    } catch (error) {
      consola.error(error);
    }
  }

  public async listObjects(req: Request, res: Response) {
    try {
      const minioClient = await StorageController.createStorageClient();
      if (!minioClient)
        return res.status(500).json({ error: "Minio client not found" });

      const listObjects = () => {
        return new Promise<Array<BucketItem>>((resolve, reject) => {
          let data: Array<BucketItem> = [];
          const stream = minioClient.listObjects("templates", "", true);

          stream.on("data", (obj) => {
            data.push(obj);
          });

          stream.on("end", () => {
            resolve(data);
          });

          stream.on("error", (err) => {
            reject(err);
          });
        });
      };

      const data = await listObjects();
      res.status(200).json({ message: "listObjects", data: data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error });
    }
  }

  public async getObjectById(req: Request, res: Response) {
    try {
      const minioClient = await StorageController.createStorageClient();
      if (!minioClient)
        return res.status(500).json({ error: "Minio client not found" });

      const listObject = () => {
        return new Promise<Array<BucketItem>>((resolve, reject) => {
          console.log(req.params.id);
          let data: Array<BucketItem> = [];
          const stream = minioClient.getObject("templates", req.params.id);
          return stream;
        });
      };

      const data = await listObject();
      res.status(200).json({ message: "listObjects", data: data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error });
    }
  }
}
