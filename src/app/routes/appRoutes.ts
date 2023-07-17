import { Router } from "express";
import AppController from "../controllers/AppController.ts";
const appController = new AppController();

const router: Router = Router();

router.get("/", appController.getAppInfo);

export default router;
