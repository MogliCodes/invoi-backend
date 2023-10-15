import { Router } from "express";
import InvoiceController from "./InvoiceController.ts";
import multer from "multer";

const invoiceController = new InvoiceController();
const router: Router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", invoiceController.getAllInvoices);
// TODO: How to PROPERLY nest API routes?
// router.get("/:id", invoiceController.getInvoiceByid);
router.post("/", invoiceController.createInvoice);

router.get("/templates", invoiceController.getAllCustomTemplates);
router.post("/template", invoiceController.uploadCustomTemplate);
router.post(
  "/import",
  upload.single("csvFile"),
  invoiceController.importInvoiceData,
);

export default router;
