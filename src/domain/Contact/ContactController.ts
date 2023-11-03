import { Request, Response } from "express";
import ContactModel from "./ContactModel.ts";

export default class ContactController {
  public async getAllContactsByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const contacts = await ContactModel.find({ id: headers?.clientId });
    res.status(200).json(contacts);
  }

  public async getContactsCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const contactCount = await ContactModel.countDocuments({
      id: headers?.clientId,
    });
    res.status(200).json(contactCount);
  }

  public async createContact(req: Request, res: Response): Promise<void> {
    const contact = await ContactModel.create(req.body);
    console.log(contact);
    res
      .status(201)
      .json({ status: 201, message: "Successfully created contact" });
  }
}
