import { Router } from "express";
import StorageController from "./StorageController.ts";

const storageController = new StorageController();
const router: Router = Router();

router.get("/bucket/", storageController.listObjects);
router.get("/buckets/", storageController.listAllBuckets);

export default router;
