import { Router } from "express";
import InvoiceController from "./InvoiceController.ts";
import multer from "multer";

const invoiceController = new InvoiceController();
const router: Router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", invoiceController.getAllInvoices);
router.get("/count", invoiceController.getInvoicesCount);
router.post("/bulk/delete", invoiceController.bulkDeleteInvoices);
router.post("/", invoiceController.createInvoice);
router.post("/pdf", invoiceController.createInvoicePdf);
router.get("/number", invoiceController.getNewInvoiceNumber);
router.get("/revenue/quarter", invoiceController.getRevenueOfCurrentQuarter);
router.get("/revenue/year", invoiceController.getRevenueOfCurrentYear);
router.get("/revenue/month", invoiceController.getRevenueOfCurrentMonth);
router.get("/tax/month", invoiceController.getTaxOfCurrentMonth);
router.get("/tax/year", invoiceController.getTaxOfCurrentYear);
router.get("/tax/quarter", invoiceController.getTaxOfCurrentQuarter);
router.get("/:id", invoiceController.getInvoiceById);
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
router.patch("/:id/mark-as-paid", invoiceController.markInvoiceAsPaid);
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
