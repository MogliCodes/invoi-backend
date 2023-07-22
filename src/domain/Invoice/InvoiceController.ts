import { Request, Response } from "express";
import InvoiceModel from "./InvoiceModel.ts";

export default class UserController {
  public async getAllInvoices(req: Request, res: Response): Promise<void> {
    const clients = await InvoiceModel.find();
    res.status(200).json(clients);
  }
}
