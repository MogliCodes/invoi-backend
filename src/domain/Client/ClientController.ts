import { Request, Response } from "express";
import ClientModel from "./ClientModel.ts";

export default class UserController {
  public async getAllClients(req: Request, res: Response): Promise<void> {
    const clients = await ClientModel.find();
    res.status(200).json(clients);
  }
}
