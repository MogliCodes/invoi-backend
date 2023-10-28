import { Router } from "express";
import ContactController from "./ContactController.ts";

const contactController = new ContactController();
const router: Router = Router();

router.get("/", contactController.getAllContactsByUserId);
router.post("/", contactController.createContact);
router.get("/count", contactController.getContactsCountByUserId);

export default router;
