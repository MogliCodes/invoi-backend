import { Request, Response } from "express";
import ClientModel from "./ClientModel.ts";
import { he } from "@faker-js/faker";

export default class ClientController {
  public async getAllClientsByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const clients = await ClientModel.find({
      user: headers?.userid,
    });
    res.status(200).json(clients);
  }

  public async getClientCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { headers } = req;
      const clientCount = await ClientModel.countDocuments({
        user: headers?.userid,
      });
      res.status(200).json(clientCount);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting client count" });
    }
  }

  public async getClientById(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const { id } = req.params;
    const client = await ClientModel.findOne({
      user: headers?.userid,
      _id: id,
    });
    res.status(200).json(client);
  }

  public async createClient(req: Request, res: Response): Promise<void> {
    const client = await ClientModel.create(req.body);
    console.log("client", client);
    res
      .status(201)
      .json({ status: 201, message: "Successfully created client" });
  }

  public async editClientById(req: Request, res: Response): Promise<void> {
    const query = { _id: req.params.id };
    const options = { upsert: true };
    const updatedClient = req.body;

    const result = ClientModel.updateOne(query, updatedClient, options)
      .then((result) => {
        const { matchedCount, modifiedCount } = result;
        if (matchedCount && modifiedCount) {
          console.log(`Successfully added a new review.`);
        }
      })
      .catch((err) => console.error(`Failed to add review: ${err}`));
    res
      .status(200)
      .json({ status: 200, message: "Successfully patched contact" });
  }

  public async deleteClientById(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: "deleteClient" });
  }
}
