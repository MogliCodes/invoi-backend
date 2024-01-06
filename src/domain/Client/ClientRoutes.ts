import { Router } from "express";
import ClientController from "./ClientController.ts";

const clientController = new ClientController();
const router: Router = Router();

router.get("/", clientController.getAllClientsByUserId);
router.get("/count", clientController.getClientCountByUserId);
router.post("/", clientController.createClient);

export default router;
