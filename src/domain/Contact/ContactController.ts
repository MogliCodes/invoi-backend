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
  public async getContacts(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    console.log("headers", headers);
    console.log("headers?.clientId", headers?.clientid);
    const { page, pageSize } = req.query;
    const contacts = await ContactModel.find({ user: headers?.clientid })
      .sort({ ["lastname"]: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json(contacts);
  }

  public async getContactById(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const { id } = req.params;
    console.log("headers?.clientId", headers?.clientid);
    console.log("getContactById", id);
    const contact = await ContactModel.findOne({
      user: headers?.clientid,
      _id: id,
    });
    res.status(200).json(contact);
  }

  public async getContactsCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    const contactCount = await ContactModel.countDocuments({
      user: headers?.clientid,
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

  public async patchContact(req: Request, res: Response): Promise<void> {
    const query = { _id: req.params.id };
    const options = { upsert: true };
    const updatedContact = req.body;

    const result = ContactModel.updateOne(query, updatedContact, options)
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

  public async deleteContact(req: Request, res: Response): Promise<void> {
    console.log("EXPRESS SERVER");
    console.log("req.params.id", req.params.id);
    const query = { _id: req.params.id };

    const result = ContactModel.deleteOne(query).catch((err) =>
      console.error(`Failed to add review: ${err}`),
    );
    res
      .status(200)
      .json({ status: 200, message: "Successfully deleted contact" });
  }

  public async bulkDeleteContacts(req: Request, res: Response): Promise<void> {
    const ids = req.body;
    const result = await ContactModel.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 200,
      message: `Successfully delete  ${result.deletedCount} contacts`,
    });
  }
}
