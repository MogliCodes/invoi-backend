import { Router } from "express";
import ClientController from "./ClientController.ts";

const clientController = new ClientController();
const router: Router = Router();

// Get data
router.get("/", clientController.getAllClientsByUserId);
router.get("/count", clientController.getClientCountByUserId);
router.get("/:id", clientController.getClientById);

// Create data
router.post("/demo", clientController.createDemoClients);
router.post("/", clientController.createClient);

// Update data
router.patch("/:id", clientController.editClientById);

// Delete data
router.delete("/:id", clientController.bulkDeleteClients);

export default router;
