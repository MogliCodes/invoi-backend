import { Router } from "express";
import InvoiceController from "./InvoiceController.ts";

const invoiceController = new InvoiceController();
const router: Router = Router();

router.get("/", invoiceController.getAllInvoices);
// TODO: How to PROPERLY nest API routes?
// router.get("/:id", invoiceController.getInvoiceByid);
router.post("/", invoiceController.createInvoice);

router.get("/templates", invoiceController.getAllCustomTemplates);
router.post("/template", invoiceController.uploadCustomTemplate);

export default router;
