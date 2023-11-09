import { Request, Response } from "express";
import InvoiceModel from "./InvoiceModel.ts";
import { StorageClient } from "@supabase/storage-js";
import Papa from "papaparse";
import mongoose, { Document } from "mongoose";
import Pdfjs from "pdfjs-dist";
import * as fs from "fs";

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
}

type InvoiceModel = {
  nr: string;
  client: string;
  title: string;
  date: Date;
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
    console.log("query params", page, pageSize);
    const clients = await InvoiceModel.find()
      .sort({ ["nr"]: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json(clients);
  }
  public async getInvoicesCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const invoiceCount = await InvoiceModel.countDocuments({
      id: headers?.clientId,
    });
    res.status(200).json(invoiceCount);
  }

  public async getInvoiceByid(req: Request, res: Response): Promise<void> {
    res.status(201).json({ message: "getInvoiceById" });
  }

  public async createInvoice(req: Request, res: Response): Promise<void> {
    // Take invoice data and create database entry

    // If invoice was written succesfully to database
    // Create PDF
    // select chosen template
    // Upload PDF to supabase storage

    res.status(201).json({ message: "getInvoiceById" });
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
          };
        },
      );
      console.log("transformedData", transformedData);

      try {
        const insertedData = await InvoiceModel.insertMany(transformedData);
        console.log("CSV data saved to MongoDB:", insertedData);
        res.json({
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
}
