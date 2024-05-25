import { Request, Response } from "express";
import ContactModel from "./ContactModel.ts";
import { faker } from "@faker-js/faker";
import { consola } from "consola";

interface RequestParams {
  id: string;
}

interface QueryParams {
  page: number;
  pageSize: number;
  search: string;
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
    const { page, pageSize, search } = req.query;
    const contacts = await ContactModel.find({
      user: headers?.userid,
    })
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
    const contact = await ContactModel.findOne({
      user: headers?.userid,
      _id: id,
    });
    res.status(200).json(contact);
  }

  public async getContactsCountByUserId(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { headers } = req;
      const contactCount = await ContactModel.countDocuments({
        user: headers?.userid,
      });
      res.status(200).json(contactCount);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting contact count" });
    }
  }

  public async createContact(req: Request, res: Response): Promise<void> {
    const contact = await ContactModel.create(req.body);
    consola.box(contact);
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
    try {
      const query = { _id: req.params.id };
      const result = ContactModel.deleteOne(query).catch((err) =>
        console.error(`Failed to add review: ${err}`),
      );
      consola.success(`Successfully deleted contact ${req.params.id}`);
      res
        .status(200)
        .json({ status: 200, message: "Successfully deleted contact" });
    } catch (err) {
      consola.error(err);
      res.status(500).json({ message: "Error deleting contact" });
    }
  }

  public async bulkDeleteContacts(req: Request, res: Response): Promise<void> {
    const ids = req.body;
    const result = await ContactModel.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 200,
      message: `Successfully delete  ${result.deletedCount} contacts`,
    });
  }

  public async createDemoData(req: Request, res: Response): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const userid: string = req.headers.userid;
    console.log("userId", userid);
    try {
      // eslint-disable-next-line no-inner-declarations
      function createRandomContact(userId = "6528f805a3b18735c132f163") {
        return {
          firstname: faker.person.firstName(),
          lastname: faker.person.lastName(),
          dob: faker.date.birthdate(),
          street: faker.location.streetAddress(),
          zip: faker.location.zipCode(),
          city: faker.location.city(),
          user: userId,
        };
      }

      for (let i = 0; i < 10; i++) {
        const contact = createRandomContact(userid);
        const res = await ContactModel.create(contact);
        console.log("res", res);
      }

      res.status(200).json({
        status: 200,
        message: `Successfully delete created demo contacts`,
      });
    } catch (error) {
      console.error("error", error);
    }
  }
}
