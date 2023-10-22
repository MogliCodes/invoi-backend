import { Router } from "express";
import ContactController from "./ContactController.ts";

const contactController = new ContactController();
const router: Router = Router();

router.get("/", contactController.getAllContactsByUserId);

export default router;
