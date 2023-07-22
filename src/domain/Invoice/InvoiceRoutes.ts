import { Router } from "express";
import InvoiceController from "./InvoiceController.ts";

const invoiceController = new InvoiceController();
const router: Router = Router();

router.get("/", invoiceController.getAllInvoices);

export default router;
