import { Request, Response } from "express";
import Pdfjs from "pdfjs-dist";
import Papa from "papaparse";
import InvoiceModel from "./InvoiceModel.ts";
import InvoiceService from "./InvoiceService.ts";
import ClientModel from "../Client/ClientModel.ts";
import { consola } from "consola";
import SettingsModel from "../Settings/SettingsModel.ts";
import StorageController from "../Storage/StorageController.ts";
import { formatTextToCSV, generateFileName } from "./InvoiceUtilities.ts";

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
import TemplatesModel from "./TemplatesModel.ts";
export default class UserController {
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
    console.log("GET INVOICES BY CLIENT", req.query);
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

    try {
      const clientData = await ClientModel.findOne({
        user: headers?.userid,
        _id: invoiceData.client,
      });
      if (!clientData) {
        res.status(404).json({ error: "Client not found" });
        return;
      }
      const settingsData = await SettingsModel.findOne({
        user: headers?.userid,
      });
      if (!settingsData) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      const pdfBuffer: Buffer = await InvoiceService.createPdf(
        invoiceData,
        clientData,
        settingsData,
      );

      const fileName = generateFileName(clientData as ClientData, invoiceData);
      const bucketName = "invoices";

      // Upload directly to MinIO
      try {
        const minioClient = await StorageController.createStorageClient();
        if (!minioClient) {
          const error = new Error("Failed to create MinIO client");
          console.error(error);
        }
        if (!minioClient) return;
        await minioClient.putObject(bucketName, fileName, pdfBuffer);
        consola.success(`Uploaded invoice to MinIO: ${fileName}`);
      } catch (error) {
        consola.error("Error uploading to MinIO:", error);
        res.status(500).json({ error: "Error uploading to MinIO" });
      }
      const invoice = await InvoiceModel.create(invoiceData);
      res.status(201).json({
        status: 201,
        message: "Successfully created invoice",
        link: `${fileName}.pdf`,
        invoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error getting client and settings data" });
    }
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
      const query = await InvoiceModel.find({ nr: new RegExp(searchQuery) });
      const latestInvoice = await InvoiceModel.findOne({
        nr: { $regex: /^2024-\d+$/ },
      }) // Match the pattern "YYYY-NNN"
        .sort({ nr: -1 }) // Sort in descending order based on the numeric value of the suffix
        .limit(1); // Limit the result to one document

      if (!latestInvoice) {
        res.send(400);
        return;
      }
      // Given invoice number
      const currentInvoiceNumber = latestInvoice.nr;

      // Extract the numeric part
      const numericPart = parseInt(currentInvoiceNumber.split("-")[1]);

      // Increment the numeric part
      const incrementedNumericPart = numericPart + 1;

      // Format the new invoice number
      const newInvoiceNumber = `2024-${String(incrementedNumericPart).padStart(
        3,
        "0",
      )}`;

      if (!query.length) {
        res.json({ number: `${currentYear}-001` });
      } else {
        res.json(newInvoiceNumber);
        console.log("query", query);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error getting new invoice number" });
    }
  }

  public async createInvoicePdf(req: Request, res: Response): Promise<void> {
    const invoiceData = req.body;
    const { headers } = req;
    const clientData = await ClientModel.findOne({
      user: headers?.userid,
      _id: invoiceData.client,
    });

    const settingsData = await SettingsModel.findOne({
      user: headers?.userid,
    });
    await InvoiceService.createPdf(invoiceData, clientData, settingsData);
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
    console.log(headers.userid);
    console.log("params", query);
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
          $gte: new Date(currentYear, month, 1),
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
      .json({ status: 200, message: "Successfully patched invoice" });
  }

  public async uploadCustomTemplates(
    req: Request,
    res: Response,
  ): Promise<void> {
    if (req.file && req.file?.buffer) {
      const { headers } = req;
      const { templatename, templatetags } = headers;
      console.log("headers", headers);
      console.log("uploadCustomTemplates", templatename, templatetags);

      const htmlFile = req.file?.buffer?.toString();
      const htmlBuffer = Buffer.from(htmlFile, "utf-8");

      const bucketName = "templates";
      const fileName = req.file.originalname;
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
          fileName,
          htmlBuffer,
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
}
