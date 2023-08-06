import { Request, Response } from "express";
import ClientModel from "./ClientModel.ts";

export default class UserController {
  public async getAllClients(req: Request, res: Response): Promise<void> {
    const clients = await ClientModel.find();
    res.status(200).json(clients);
  }

  public async getClientById(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: "getCliebtById" });
  }

  public async createClient(req: Request, res: Response): Promise<void> {
    res.status(201).json({ message: "createClient" });
  }

  public async editClientById(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: "editClient" });
  }

  public async deleteClientById(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: "deleteClient" });
  }
}
