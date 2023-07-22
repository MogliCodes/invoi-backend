import { Router } from "express";
import ClientController from "./ClientController.ts";

const clientController = new ClientController();
const router: Router = Router();

router.get("/", clientController.getAllClients);

export default router;
