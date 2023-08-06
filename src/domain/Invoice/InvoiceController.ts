import { Request, Response } from "express";
import InvoiceModel from "./InvoiceModel.ts";
import { StorageClient } from "@supabase/storage-js";

const STORAGE_URL = "https://dpoohyfcotuziotpwgbf.supabase.co/storage/v1";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export default class UserController {
  public async getAllInvoices(req: Request, res: Response): Promise<void> {
    const clients = await InvoiceModel.find();
    res.status(200).json(clients);
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
    // Need supabase client
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
}
