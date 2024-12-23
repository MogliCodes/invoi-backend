import { NextFunction, Request, Response, Router } from "express";
import InvoiceController from "./InvoiceController.ts";
import multer from "multer";

const invoiceController = new InvoiceController();
const router: Router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/draft", invoiceController.getInvoiceDrafts);
router.post("/draft", invoiceController.createInvoiceDraft);

router.get("/", invoiceController.getAllInvoices);
router.get("/count", invoiceController.getInvoicesCount);
router.get("/client", invoiceController.getInvoicesByClient);
router.post("/bulk/delete", invoiceController.bulkDeleteInvoices);
router.post("/", invoiceController.createInvoice);
router.post("/pdf", invoiceController.createInvoicePdf);
router.get("/number/:year", invoiceController.getNewInvoiceNumberForYear);
router.get("/number", invoiceController.getNewInvoiceNumber);
router.get(
  "/revenue/range/year",
  invoiceController.getRevenueRangeOfCurrentYear,
);
router.get("/revenue/quarter", invoiceController.getRevenueOfCurrentQuarter);
router.get("/revenue/year", invoiceController.getRevenueOfCurrentYear);
router.get("/revenue/month", invoiceController.getRevenueOfCurrentMonth);
router.get("/revenue/:clientId", invoiceController.getRevenueByClient);
router.get("/tax/month", invoiceController.getTaxOfCurrentMonth);
router.get("/tax/year", invoiceController.getTaxOfCurrentYear);
router.get("/tax/quarter", invoiceController.getTaxOfCurrentQuarter);
router.get("/templates", invoiceController.getCustomTemplates);
router.get("/templates/:id", invoiceController.getTemplateById);
router.get("/templates/:id/html", invoiceController.getTemplateHtml);
router.get("/categories", (req, res) => res.status(200).json([]));
router.get("/template", (req, res) => res.status(200).json([]));

router.get(
  "/template/default/preview",
  invoiceController.getDefaultTemplatePreview,
);

router.get("/:id", invoiceController.getInvoiceById);
router.post(
  "/templates/upload",
  logRequest,
  upload.single("templateFirstPage"),
  invoiceController.uploadCustomTemplates,
  invoiceController.uploadCustomTemplates,
);
router.post("/template", invoiceController.uploadCustomTemplate);
router.delete("/templates/:id", invoiceController.deleteCustomTemplate);
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
router.patch("/set-status", invoiceController.setInvoiceStatus);
router.patch("/:id/mark-as-paid", invoiceController.markInvoiceAsPaid);
router.delete("/:id", invoiceController.deleteInvoice);

function logRequest(req: Request, res: Response, next: NextFunction) {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
}

export default router;
