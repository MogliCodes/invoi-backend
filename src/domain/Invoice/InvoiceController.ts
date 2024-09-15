import { Request, Response } from "express";
import Pdfjs from "pdfjs-dist";
import Papa from "papaparse";
import { consola } from "consola";

import TemplatesModel from "./TemplatesModel.ts";
import ContactModel from "../Contact/ContactModel.ts";
import InvoiceModel, { IInvoice } from "./InvoiceModel.ts";
import InvoiceDraftModel from "./InvoiceDraftModel.ts";

import ClientModel from "../Client/ClientModel.ts";
import SettingsModel from "../Settings/SettingsModel.ts";
import InvoiceService, {
  FetchDataForInvoiceCreationResponse,
} from "./InvoiceService.ts";
import StorageController from "../Storage/StorageController.ts";
import {
  formatTextToCSV,
  generateFileName,
  isInvoiceDue,
} from "./InvoiceUtilities.ts";

type Invoice = {
  _id: string;
  title: string;
  nr: string;
  client: string;
  project: string;
  date: Date;
  performancePeriodStart: Date;
  performancePeriodEnd: Date;
  items: string;
  status: string;
  total: number;
  taxes: number;
  contact: string;
  totalWithTaxes: number;
  storagePath: string;
};

type RangeParams = {
  start: string;
  end: string;
};

import type {
  ClientData,
  CustomHeaders,
  InvoiceCsvData,
  ParsedInvoice,
  QueryParams,
  RequestBody,
  RequestParams,
  ResponseData,
} from "../../types.d.ts";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

export default class InvoiceController {
  public sendHttpResponse<T>(res: Response, data: Array<T> | string) {
    if (data && data.length > 0) {
      res.status(200).json({ data: data, status: 200, total: data.length });
    } else {
      res.status(404).json({ status: 404, message: "No data found" });
    }
  }

  public async getAllInvoices(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { page, pageSize } = req.query;
    const { headers } = req;
    const clients = await InvoiceModel.find({ user: headers.userid })
      .sort({ ["nr"]: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json(clients);
  }

  public async getInvoicesByClient(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    // @ts-ignore
    const { page, pageSize, client } = req.query;
    const { headers } = req;
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      client,
    })
      .sort({ ["nr"]: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json(invoices);
  }

  /**
   * @swagger
   * /invoice/{id}:
   *   get:
   *     tags:
   *      - Invoices
   *     summary: Get an invoice by ID
   *     description: Returns a single invoice
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: A single invoice
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 title:
   *                   type: string
   *                   description: The title of the invoice
   */
  public async getInvoiceById(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    console.log("GET INVOICE BY ID");
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id).populate("client").exec();
    res.status(200).json(invoice);
  }

  /**
   * @swagger
   * /invoice/count:
   *   get:
   *     tags:
   *      - Invoices
   *     summary: Get the count of all invoices
   *     description: Returns the count of all invoices
   *     responses:
   *       200:
   *         description: The count of all invoices
   *         content:
   *           application/json:
   *             schema:
   *               type: integer
   */
  public async getInvoicesCount(req: Request, res: Response): Promise<void> {
    try {
      const { headers } = req;
      const invoiceCount = await InvoiceModel.countDocuments({
        user: headers?.userid,
      });
      res.status(200).json(invoiceCount);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting invoice count" });
    }
  }

  /**
   * @swagger
   * /invoice:
   *   post:
   *     tags:
   *      - Invoices
   *     summary: Create a new invoice
   *     description: Creates a new invoice with the provided data
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               client:
   *                 type: string
   *                 description: The ID of the client
   *               title:
   *                 type: string
   *                 description: The title of the invoice
   *     responses:
   *       201:
   *         description: The created invoice
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 title:
   *                   type: string
   */
  public async createInvoice(req: Request, res: Response): Promise<void> {
    const invoiceData = req.body;
    const headers = req.headers as CustomHeaders;

    const userId: string = headers.userid || "";
    const clientId: string = invoiceData.client || "";
    const contactId: string = invoiceData.contact || "";

    consola.info("Initiating invoice creation. Fetching data for invoice...");
    const invoiceDataForInvoiceCreation: FetchDataForInvoiceCreationResponse =
      await InvoiceService.fetchDataForInvoiceCreation(
        userId,
        clientId,
        contactId,
      );

    if (!invoiceDataForInvoiceCreation || !invoiceDataForInvoiceCreation.data) {
      consola.error("Error getting client and settings data");
      res.status(500).json({ error: "Error getting client and settings data" });
      return;
    }
    consola.success(
      "Successfully fetched data for invoice creation. Now creating PDF...",
    );

    const { clientData, settingsData, contactData } =
      invoiceDataForInvoiceCreation.data;

    const pdfBuffer: Buffer = await InvoiceService.createPdf(
      invoiceData,
      clientData,
      settingsData,
      contactData,
    );
    consola.success("Successfully created PDF. Now uploading to MinIO...");

    const fileName = generateFileName(clientData as ClientData, invoiceData);
    const bucketName = userId;

    // Upload directly to MinIO
    try {
      const minioClient = await StorageController.createStorageClient();
      if (!minioClient) {
        const error = new Error("Failed to create MinIO client");
        console.error(error);
      }
      if (!minioClient) return;
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
      }

      await minioClient.putObject(bucketName, fileName, pdfBuffer);
      consola.success(`Successfully uploaded invoice to MinIO: ${fileName}`);
    } catch (error) {
      consola.error("Error uploading to MinIO:", error);
      res.status(500).json({ error: "Error uploading to MinIO" });
    }
    const invoice = await InvoiceModel.create(invoiceData);
    consola.success("Successfully created invoice in MongoDB");
    consola.success("Invoice creation completed successfully");
    res.status(201).json({
      status: 201,
      message: "Successfully created invoice",
      link: `${fileName}.pdf`,
      invoice,
    });
  }

  /**
   * @swagger
   * /invoice/template:
   *   post:
   *     tags:
   *      - Invoices
   *     summary: Upload a custom invoice template
   *     description: Uploads a custom invoice template
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               template:
   *                 type: string
   *                 format: binary
   *                 description: The custom invoice template file
   *     responses:
   *       200:
   *         description: The uploaded template
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  public async uploadCustomTemplate(
    req: Request,
    res: Response,
  ): Promise<void> {
    console.log(req);
    res.json({ message: "Hello" });
  }

  public async importInvoiceData(req: Request, res: Response): Promise<void> {
    console.log(req);
    if (req.file) {
      console.log(req.file.buffer.toString());
      const csvData = req.file.buffer.toString();

      // Parse CSV data using Papa Parse
      const parsedData: Papa.ParseResult<ParsedInvoice> = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      const transformedData: Array<InvoiceCsvData> = parsedData.data.map(
        (invoice: ParsedInvoice) => {
          return {
            nr: invoice.Rechnungsnummer,
            client: invoice.Kunde,
            title: invoice.Projekt,
            date: new Date(
              invoice.Rechnungsdatum.split(".").reverse().join("-"),
            ),
            total: invoice["Netto-Rechnungssume"],
            taxes: invoice["Mwst."],
            totalWithTaxes: invoice["Brutto-Rechnungssume"],
            user: invoice.user,
          };
        },
      );
      console.log("transformedData", transformedData);

      try {
        const insertedData = await InvoiceModel.insertMany(transformedData);
        console.log("CSV data saved to MongoDB:", insertedData);
        res.json({
          status: 200,
          message: "CSV data uploaded and saved to MongoDB successfully.",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error saving data to MongoDB" });
      }
    }
  }

  public async importPdfInvoiceData(
    req: Request,
    res: Response,
  ): Promise<void> {
    if (req.file) {
      console.log(req.file.buffer.toString());
      const data: Buffer = req.file.buffer;
      const dataArray: Uint8Array = new Uint8Array(data);
      const doc: PDFDocumentProxy = await Pdfjs.getDocument(dataArray).promise;
      const numPages: number = doc.numPages;
      let pdfContent: string = "";

      for (let pageIndex: number = 0; pageIndex < numPages; pageIndex++) {
        const page: PDFPageProxy = await doc.getPage(pageIndex + 1);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => {
            if ("str" in item) {
              return item.str;
            }
          })
          .join(" ");
        pdfContent += pageText;
      }
      const startIndex = pdfContent.indexOf("Position");
      let invoiceData = "";
      if (startIndex !== -1) {
        invoiceData = pdfContent.substring(startIndex);
      }
      const formattedCSV = formatTextToCSV(invoiceData);

      // Send response
      this.sendHttpResponse(res, formattedCSV);
    }
  }

  public async getNewInvoiceNumber(req: Request, res: Response): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const searchQuery = `^${currentYear}`;

      const latestInvoice: IInvoice | null = await InvoiceModel.findOne({
        user: req.headers.userid,
        nr: { $regex: new RegExp(`^${currentYear}-\\d+$`) },
      })
        .sort({ nr: -1 }) // Sort in descending order based on the numeric value of the suffix
        .limit(1); // Limit the result to one document

      let newInvoiceNumber: string;
      if (!latestInvoice) {
        consola.info("Could not get latest invoice number");
        newInvoiceNumber = `${currentYear}-001`;
      } else {
        // Extract the numeric part
        const currentInvoiceNumber = latestInvoice.nr;
        const numericPart = parseInt(currentInvoiceNumber.split("-")[1], 10);
        // Increment the numeric part
        const incrementedNumericPart = numericPart + 1;
        // Format the new invoice number
        newInvoiceNumber = `${currentYear}-${String(
          incrementedNumericPart,
        ).padStart(3, "0")}`;
      }
      console.log(newInvoiceNumber);
      res.json({ number: newInvoiceNumber });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error getting new invoice number" });
    }
  }

  public async getNewInvoiceNumberForYear(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { year } = req.params;
      const searchQuery = `^${year}`;

      const latestInvoice: IInvoice | null = await InvoiceModel.findOne({
        user: req.headers.userid,
        nr: { $regex: new RegExp(`^${year}-\\d+$`) },
      })
        .sort({ nr: -1 }) // Sort in descending order based on the numeric value of the suffix
        .limit(1); // Limit the result to one document

      let newInvoiceNumber: string;
      if (!latestInvoice) {
        consola.info("Could not get latest invoice number");
        newInvoiceNumber = `${year}-001`;
      } else {
        // Extract the numeric part
        const currentInvoiceNumber = latestInvoice.nr;
        const numericPart = parseInt(currentInvoiceNumber.split("-")[1], 10);
        // Increment the numeric part
        const incrementedNumericPart = numericPart + 1;
        // Format the new invoice number
        newInvoiceNumber = `${year}-${String(incrementedNumericPart).padStart(
          3,
          "0",
        )}`;
      }
      console.log(newInvoiceNumber);
      res.json({ number: newInvoiceNumber });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error getting new invoice number" });
    }
  }

  public async createInvoicePdf(req: Request, res: Response): Promise<void> {
    const invoiceData = req.body;
    const { headers } = req;
    console.log("invoiceData", invoiceData.client);
    const clientData = await ClientModel.findOne({
      user: headers?.userid,
      _id: invoiceData.client,
    });

    const settingsData = await SettingsModel.findOne({
      user: headers?.userid,
    });

    let contactData;
    if (invoiceData.contact) {
      contactData = await ContactModel.findOne({
        user: headers?.userid,
        _id: invoiceData.contact,
      });
    }

    await InvoiceService.createPdf(
      invoiceData,
      clientData,
      settingsData,
      contactData,
    );
    consola.success("Created pdf");
    res.json({ message: "Created pdf" });
  }

  public async deleteInvoice(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    consola.info("Deleted invoice with ID: ", id);
    await InvoiceModel.findByIdAndDelete(id);
    res.json({ message: "Deleted invoice", status: 200 });
  }

  public async bulkDeleteInvoices(req: Request, res: Response): Promise<void> {
    const invoices = req.body;
    await InvoiceModel.deleteMany({ _id: { $in: invoices } });
    consola.info(
      `Successfully deleted invoices with the following ids: ${invoices.join(
        ", ",
      )}`,
    );
    res.json({ message: "Deleted invoices", status: 200 });
  }

  public async getRevenueOfCurrentMonth(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 0),
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.total || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async getRevenueOfCurrentQuarter(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const quarter = Math.floor(currentMonth / 3);
    const startDate = new Date(currentYear, quarter * 3, 1);
    const endDate = new Date(currentYear, quarter * 3 + 3, 0);
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.total || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async getRevenueOfCurrentYear(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const currentYear = new Date().getFullYear();
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 0),
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.total || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async getRevenueRangeOfCurrentYear(req: Request, res: Response) {
    const { headers, query } = req;
    const { start, end } = query as RangeParams;
    const startYear = new Date(start).getFullYear();
    const startMonth = new Date(start).getMonth();
    const currentYear = new Date().getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthlyRevenues = [];

    for (let month = 0; month < 12; month++) {
      const invoices = await InvoiceModel.find({
        user: headers.userid,
        date: {
          $gte: new Date(startYear, startMonth, 1),
          $lt: new Date(currentYear, month + 1, 0),
        },
      });

      // Accumulate the total of all invoices
      const total = invoices.reduce(
        (acc, invoice) => acc + parseInt(invoice?.total || ""),
        0,
      );

      monthlyRevenues.push({ month: months[month], y: total });
    }

    res.status(200).json(monthlyRevenues);
  }

  public async getRevenueByClient(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const { clientId } = req.params;
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      client: clientId,
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.total || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async getTaxOfCurrentMonth(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 0),
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.taxes || ""),
      0,
    );
    console.log("total", total);
    res.status(200).json(total);
  }

  public async getTaxOfCurrentQuarter(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const quarter = Math.floor(currentMonth / 3);
    const startDate = new Date(currentYear, quarter * 3, 1);
    const endDate = new Date(currentYear, quarter * 3 + 3, 0);
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.taxes || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async getTaxOfCurrentYear(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const currentYear = new Date().getFullYear();
    const invoices = await InvoiceModel.find({
      user: headers.userid,
      date: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 0),
      },
    });

    // Accumulate the total of all invoices
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.taxes || ""),
      0,
    );

    res.status(200).json(total);
  }

  public async markInvoiceAsPaid(req: Request, res: Response): Promise<void> {
    console.log("markInvoiceAsPaid", req.params.id);
    const query = { _id: req.params.id };
    const options = { upsert: true };
    const updatedInvoice = req.body;
    console.log("updatedInvoice", updatedInvoice);

    InvoiceModel.updateOne(query, updatedInvoice, options)
      .then((result) => {
        const { matchedCount, modifiedCount } = result;
        if (matchedCount && modifiedCount) {
          console.log(`Successfully added a new review.`);
        }
      })
      .catch((err) => console.error(`Failed to add review: ${err}`));
    res
      .status(200)
      .json({ status: 200, message: "Rechnung wurde als 'bezahlt' markiert." });
  }

  public async uploadCustomTemplates(
    req: Request,
    res: Response,
  ): Promise<void> {
    if (req.file && req.file?.buffer) {
      const { headers } = req;
      const { templatename, templatetags } = headers;
      const userId = req.params.userId; // Assumes userId is in URL parameters
      const invoiceName = req.body.invoiceName; // Assumes invoiceName is in the request body
      const bucketName = userId;
      const fileName = req.file.originalname; // Original name of the uploaded file
      const filePath = `/${userId}/invoices/${invoiceName}`; // Construct the path
      let uploadedObjectInfo;
      try {
        const minioClient = await StorageController.createStorageClient();
        if (!minioClient) {
          const error = new Error("Failed to create MinIO client");
          console.error(error);
        }
        if (!minioClient) return;
        uploadedObjectInfo = await minioClient.putObject(
          bucketName,
          filePath,
          req.file.buffer, // Use the buffer from the uploaded file
        );
        consola.success(`Uploaded invoice to MinIO: ${fileName}`);
        res
          .status(200)
          .json({ status: 200, message: "Successfully uploaded template" });
      } catch (error) {
        consola.error("Error uploading to MinIO:", error);
        res.status(500).json({ error: "Error uploading to MinIO" });
      }

      try {
        await TemplatesModel.create({
          title: fileName,
          name: templatename,
          user: req.headers.userid,
          fileName,
          etag: uploadedObjectInfo?.etag,
          tags: templatetags,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error saving template to MongoDB" });
      }
    }
  }

  public async getCustomTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await TemplatesModel.find({ user: req.headers.userid });
      setTimeout(() => {
        res.status(200).json(templates);
      }, 4000);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error getting templates" });
    }
  }

  public async getTemplateById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const template = await TemplatesModel.findById(id);
    res.status(200).json(template);
  }

  public async deleteCustomTemplate(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { id } = req.params;
    console.log("DELETE ID", id);
    await TemplatesModel.findByIdAndDelete(id);
    res.json({ message: "Deleted template", status: 200 });
  }

  public async getInvoiceDrafts(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const drafts = await InvoiceDraftModel.find({ user: headers.userid });
    res.status(200).json(drafts);
  }

  public async createInvoiceDraft(req: Request, res: Response): Promise<void> {
    const invoiceDraftData = req.body;
    const headers = req.headers as CustomHeaders;
    try {
      const invoiceDraft = await InvoiceDraftModel.create(invoiceDraftData);
      res.status(201).json({
        status: 201,
        message: "Successfully created invoice draft",
        invoiceDraft,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creating invoice draft" });
    }
  }

  public async setInvoiceStatus(req: Request, res: Response): Promise<void> {
    const invoices: Array<Invoice> = await InvoiceModel.find();
    const unpaidInvoices = invoices.filter(
      (invoice) => invoice.status !== "paid",
    );

    // loop over all invoices, if invoice is due, set status to overdue by patching this invoice
    for (const invoice of unpaidInvoices) {
      if (isInvoiceDue(invoice)) {
        const query = { _id: invoice._id };
        const options = { upsert: true };
        const updatedInvoice = { status: "overdue" };
        InvoiceModel.updateOne(query, updatedInvoice, options)
          .then((result) => {
            const { matchedCount, modifiedCount } = result;
            if (matchedCount && modifiedCount) {
              console.log(`Successfully updated invoice status.`);
            }
          })
          .catch((err) =>
            console.error(`Failed to update invoice status: ${err}`),
          );
      }
    }

    console.log("invoices", invoices);
    res.json({ data: invoices });
  }
}
