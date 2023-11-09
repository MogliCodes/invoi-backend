import { Router } from "express";
import ContactController from "./ContactController.ts";
import { validateContact } from "./ContactValidator.ts";

const contactController = new ContactController();
const router: Router = Router();

router.get("/count", contactController.getContactsCountByUserId);
router.get("/:id", contactController.getContactById);
router.get("/", contactController.getContacts);
router.post("/", validateContact, contactController.createContact);
router.patch("/:id", validateContact, contactController.patchContact);

export default router;
