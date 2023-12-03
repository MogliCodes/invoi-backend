import { Router } from "express";
import InvoiceController from "./InvoiceController.ts";
import multer from "multer";

const invoiceController = new InvoiceController();
const router: Router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", invoiceController.getAllInvoices);
router.get("/count", invoiceController.getInvoicesCountByUserId);

// TODO: How to PROPERLY nest API routes?
// router.get("/:id", invoiceController.getInvoiceByid);
router.post("/bulk/delete", invoiceController.bulkDeleteInvoices);
router.post("/", invoiceController.createInvoice);
router.post("/pdf", invoiceController.createInvoicePdf);
router.get("/templates", invoiceController.getAllCustomTemplates);
router.get("/number", invoiceController.getNewInvoiceNumber);
router.post("/template", invoiceController.uploadCustomTemplate);
router.post(
  "/import",
  upload.single("csvFile"),
  invoiceController.importInvoiceData,
);

router.post(
  "/import/pdf",
  upload.single("pdfFile"),
  invoiceController.importPdfInvoiceData,
);
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
