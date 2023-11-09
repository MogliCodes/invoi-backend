import { Router } from "express";
import ContactController from "./ContactController.ts";

const contactController = new ContactController();
const router: Router = Router();

router.get("/count", contactController.getContactsCountByUserId);
router.get("/:id", contactController.getContactById);
router.get("/", contactController.getContacts);
router.post("/", contactController.createContact);
router.patch("/:id", contactController.patchContact);

export default router;
