import { Router } from "express";
import StorageController from "./StorageController.ts";

const storageController = new StorageController();
const router: Router = Router();

router.get("/bucket/", storageController.listObjects);
router.get("/buckets/", storageController.listAllBuckets);
router.get("/objects/", storageController.listAllBuckets);
router.get("/objects/:id", storageController.getObjectById);

export default router;
