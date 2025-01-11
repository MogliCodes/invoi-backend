// import { consola } from "consola";
// import { Request, Response } from "express";
// import type { CustomHeaders } from "../../types.js";
// import InvoiceService, {
//   FetchDataForInvoiceCreationResponse,
// } from "../Invoice/InvoiceService.js";
//
// export default class PdfController {
//   public static validateRequest(req: Request): void {
//     const invoiceData = req.body;
//     if (!invoiceData.userid) {
//       throw new Error("User ID is missing.");
//       return;
//     }
//     if (!invoiceData.client) {
//       throw new Error("Client is missing.");
//       return;
//     }
//     if (!invoiceData.contact) {
//       throw new Error("Contact is missing.");
//       return;
//     }
//     if (!invoiceData.items) {
//       throw new Error("Items are missing.");
//       return;
//     }
//   }
//
//   public static validateDataForInvoiceCreation(
//     data: FetchDataForInvoiceCreationResponse,
//   ): void {
//     if (!data.client) {
//       throw new Error("Client data is missing.");
//       return;
//     }
//     if (!data.contact) {
//       throw new Error("Contact data is missing.");
//       return;
//     }
//     if (!data.items) {
//       throw new Error("Items are missing.");
//       return;
//     }
//   }
//
//   public static async createInvoice(
//     req: Request,
//     res: Response,
//   ): Promise<void> {
//     try {
//       /** =================================================================
//        * Take request in and validate it
//        ================================================================= */
//       const invoiceData = req.body;
//       const headers = req.headers as unknown as CustomHeaders;
//       PdfController.validateRequest(req);
//
//       /** =================================================================
//        * Extract necessary data from request
//        ================================================================= */
//       const userId: string = headers.userid!;
//       const clientId: string = invoiceData.client;
//       const contactId: string = invoiceData.contact;
//       console.info(
//         `User ${userId} is creating invoice for client ${clientId} with contact ${contactId}`,
//       );
//
//       /** =================================================================
//        * Fetch data for invoice creation and validate it
//        ================================================================= */
//       consola.info("Fetching data for pdf creation...");
//       const invoiceDataForInvoiceCreation: FetchDataForInvoiceCreationResponse =
//         await InvoiceService.fetchDataForInvoiceCreation(
//           userId,
//           clientId,
//           contactId,
//         );
//       PdfController.validateDataForInvoiceCreation(
//         invoiceDataForInvoiceCreation,
//       );
//
//       /** =================================================================
//        * Fetch templates from MinIO or use defaults
//         ================================================================= */
//
//       /** =================================================================
//        * Use handlebars to create HTML from template and data
//         ================================================================= */
//
//       /** =================================================================
//        * Use Playwright to create PDF from HTML
//         ================================================================= */
//     } catch (err) {
//       consola.error("Error creating PDF:", err);
//       throw err;
//     }
//   }
// }
