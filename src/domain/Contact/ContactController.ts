import { Request, Response } from "express";
import ContactModel from "./ContactModel.ts";

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

export default class ContactController {
  public async getAllContactsByUserId(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const { page, pageSize } = req.query;
    const contacts = await ContactModel.find({ id: headers?.clientId })
      .sort({ ["lastname"]: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
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
