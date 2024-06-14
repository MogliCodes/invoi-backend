import { Router } from "express";
import ContactController from "./ContactController.ts";
import { validateContact } from "./ContactValidator.ts";

const contactController = new ContactController();
const router: Router = Router();

// Get data
router.get("/count", contactController.getContactsCountByUserId);
router.get("/", contactController.getContacts);
router.get("/:id", contactController.getContactById);

// Create data
router.post("/demo", contactController.createDemoData);
router.post("/bulk/delete", contactController.bulkDeleteContacts);
router.post("/", validateContact, contactController.createContact);

// Update data
router.patch("/:id", validateContact, contactController.patchContact);

// Delete data
router.delete("/:id", contactController.deleteContact);

export default router;
