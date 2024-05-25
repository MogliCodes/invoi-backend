import { Request, Response } from "express";
import InvoiceModel from "./InvoiceModel.ts";
import InvoiceService from "./InvoiceService.js";
import { StorageClient } from "@supabase/storage-js";
import Papa from "papaparse";
import mongoose, { Document } from "mongoose";
import Pdfjs from "pdfjs-dist";
import ClientController from "../Client/ClientController.js";
import ClientModel from "../Client/ClientModel.js";
import { consola } from "consola";
import SettingsModel from "../Settings/SettingsModel.ts";
import StorageController from "../Storage/StorageController.js";
import fs from "fs";

const clientController = new ClientController();
const STORAGE_URL = "https://dpoohyfcotuziotpwgbf.supabase.co/storage/v1";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const csvSchema = new mongoose.Schema({
  Dateiname: String,
  Kunde: String,
  Projekt: String,
  Rechnungsnummer: String,
  Rechnungsdatum: String,
  "Mwst.": String,
  "Netto-Rechnungssume": String,
  "Brutto-Rechnungssume": String,
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CsvModel = mongoose.model("CsvModel", csvSchema);

interface ParsedInvoice extends Document {
  Dateiname: string;
  Kunde: string;
  Projekt: string;
  Rechnungsnummer: string;
  Rechnungsdatum: string;
  "Mwst.": string;
  "Netto-Rechnungssume": string;
  "Brutto-Rechnungssume": string;
  user: string;
}

type InvoiceModel = {
  nr: string;
  client: string;
  title: string;
  date: Date;
};
type InvoicePosition = {
  position: number;
  description: string;
  hours: number;
  factor: number;
  total: number;
};
type InvoiceData = {
  nr: string;
  client: string;
  title: string;
  date: string;
  performancePeriodStart: string;
  performancePeriodEnd: string;
  items: Array<InvoicePosition>;
  total: number;
  taxes: number;
  totalWithTaxes: number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CsvData = {
  data: Array<ParsedInvoice>;
};

interface RequestParams {
  id: string;
}

interface QueryParams {
  page: number;
  pageSize: number;
}

interface RequestBody {
  key: string;
  value: string;
}

interface ResponseData {
  message: string;
}

type ClientData = {
  company: string;
  street: string;
  zip: string;
  city: string;
};

// Function to convert extracted text to CSV
function formatTextToCSV(text: string) {
  const rows = text.split("\n");

  const headers = rows[0].trim().split(/\s+/);
  const rowsAndColumns = rows.slice(1).map((row) => {
    const columns = row.trim().split(/\s{2,}/); // Split on 2 or more consecutive spaces
    const position = columns[0];
    const leistung = columns[1];
    const stundensatz = columns[2];
    const faktor = columns[3];
    const gesamtpreis = columns[4];
    return [position, leistung, stundensatz, faktor, gesamtpreis];
  });

  const csvRows = rowsAndColumns.map((columns) => columns.join(","));
  const csvString = [headers.join(","), ...csvRows].join("\n");
  return csvString;
}

export default class UserController {
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
  public async getInvoicesCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
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

  public async getInvoiceByid(req: Request, res: Response): Promise<void> {
    res.status(201).json({ message: "getInvoiceById" });
  }

  public async createInvoice(req: Request, res: Response): Promise<void> {
    const invoiceData = req.body;
    const { headers } = req;
    const clientData = await ClientModel.findOne({
      user: headers?.userid,
      _id: invoiceData.client,
    });
    const settingsData = await SettingsModel.findOne({
      user: headers?.userid,
    });
    try {
      const absolutePathToPdf = await InvoiceService.createPdf(
        invoiceData,
        clientData,
        settingsData,
      );
      const fileName = invoiceData.nr;
      invoiceData.storagePath = absolutePathToPdf;
      const invoice = await InvoiceModel.create(invoiceData);
      console.log(invoice);
      consola.success(`Created invoice at path: ${absolutePathToPdf}`);
      res.status(201).json({
        status: 201,
        message: "Successfully created invoice",
        link: `${fileName}.pdf`,
        invoice,
      });
      try {
        const minioClient = await StorageController.createStorageClient();
        const bucketName = "invoices";

        if (!minioClient) return;
        const file = fs.readFileSync(absolutePathToPdf);
        await minioClient.putObject(bucketName, `${fileName}.pdf`, file);
      } catch (error) {
        consola.error(error);
      }
    } catch (error) {
      consola.error(error);
      res.status(500).json({ error: "Error creating invoice" });
    }
  }

  public async uploadInvoicePdfTemplate(
    req: Request,
    res: Response,
  ): Promise<void> {
    // Validate the pdf template
    res.status(201).json({ message: "getInvoiceById" });
  }

  public async getAllCustomTemplates(
    req: Request,
    res: Response,
  ): Promise<void> {
    const storageClient = new StorageClient(STORAGE_URL, {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    });
    console.log(storageClient);

    const { data } = await storageClient
      .from("Invoices")
      .getPublicUrl("/Download.png");
    res.status(201).json({ message: data });
  }

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

      const transformedData: Array<InvoiceModel> = parsedData.data.map(
        (invoice) => {
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
    console.log("hello pdf import");
    if (req.file) {
      console.log(req.file.buffer.toString());
      const data = req.file.buffer;
      const dataArray = new Uint8Array(data);
      const doc = await Pdfjs.getDocument(dataArray).promise;
      console.log("dataArray", dataArray);
      console.log("doc", doc);

      const numPages = doc.numPages;

      let pdfContent = "";

      for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
        const page = await doc.getPage(pageIndex + 1);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        pdfContent += pageText;
      }
      const startIndex = pdfContent.indexOf("Position");
      let invoiceData = "";
      if (startIndex !== -1) {
        invoiceData = pdfContent.substring(startIndex);
      }
      console.log("invoiceData", invoiceData);

      const formattedCSV = formatTextToCSV(invoiceData);
      console.log("formattedCSV", formattedCSV);

      res.send("HELLO");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getNewInvoiceNumber(req: Request, res: Response): Promise<void> {
    const currentYear = new Date().getFullYear();
    console.log("currentYear", currentYear);
    const searchQuery = `^${currentYear}`;
    console.log("searchQuery", searchQuery);

    const query = await InvoiceModel.find({ nr: new RegExp(searchQuery) });
    const latestInvoice = await InvoiceModel.findOne({
      nr: { $regex: /^2023-\d+$/ },
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
    const newInvoiceNumber = `2023-${String(incrementedNumericPart).padStart(
      3,
      "0",
    )}`;
    console.log("newInvoiceNumber", newInvoiceNumber);

    if (!query.length) {
      res.json({ number: `${currentYear}-001` });
    } else {
      res.json(newInvoiceNumber);
      console.log("query", query);
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
    console.log("DELETE ID", id);
    await InvoiceModel.findByIdAndDelete(id);
    res.json({ message: "Deleted invoice" });
  }

  public async bulkDeleteInvoices(req: Request, res: Response): Promise<void> {
    const invoices = req.body;
    await InvoiceModel.deleteMany({ _id: { $in: invoices } });
    consola.info(
      `Successfully deleted invoices with the following ids: ${invoices.join(
        ", ",
      )}`,
    );
    res.json({ message: "Deleted invoices" });
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
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
    const total = invoices.reduce(
      (acc, invoice) => acc + parseInt(invoice?.taxes || ""),
      0,
    );

    res.status(200).json(total);
  }
}
