import { Router } from "express";
import ClientController from "./ClientController.ts";

const clientController = new ClientController();
const router: Router = Router();

router.get("/", clientController.getAllClientsByUserId);
router.get("/:id", clientController.getClientById);
router.get("/count", clientController.getClientCountByUserId);
router.post("/", clientController.createClient);
router.patch("/:id", clientController.editClientById);

export default router;
