import { Router } from "express";
import ServicesController from "./ServicesController.ts";

const router: Router = Router();
const servicesController = new ServicesController();

router.post("/", servicesController.createService);
router.get("/", servicesController.getAllServices);

export default router;
