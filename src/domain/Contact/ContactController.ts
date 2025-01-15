import { Request, Response } from "express";
import ContactModel, { IContact } from "./ContactModel.ts";
import { faker } from "@faker-js/faker";
import { consola } from "consola";
import {
  RequestParams,
  ResponseData,
  RequestBody,
  QueryParams,
  // eslint-disable-next-line node/no-missing-import
} from "../../types.js";
import mongoose from "mongoose";

type ContactFilter = {
  user: string;
  client?: string;
};

export default class ContactController {
  /**
   * @swagger
   * /contacts/:
   *   get:
   *     tags:
   *      - Contacts
   *     summary: Retrieve a list of contacts
   *     description: Fetch a paginated list of contacts for the user specified in the headers.
   *     parameters:
   *       - in: query
   *         name: page
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The page number for pagination.
   *       - in: query
   *         name: pageSize
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The number of contacts per page.
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *         description: A search term to filter contacts by name.
   *       - in: header
   *         name: userid
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user whose contacts are to be fetched.
   *     responses:
   *       200:
   *         description: A list of contacts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   _id:
   *                     type: string
   *                     description: The contact ID.
   *                   firstname:
   *                     type: string
   *                     description: The contact's first name.
   *                   lastname:
   *                     type: string
   *                     description: The contact's last name.
   *                   email:
   *                     type: string
   *                     description: The contact's email address.
   *                   phone:
   *                     type: string
   *                     description: The contact's phone number.
   *       400:
   *         description: Bad Request
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal Server Error
   */
  public async getContacts(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { headers } = req;
    if (!headers?.userid) {
      res.status(401).json({ message: "Unauthorized" });
    }
    consola.info("Getting contacts for user: ", headers?.userid);

    const { page, pageSize } = req.query;

    const currentPage = parseInt(page?.toString() || "1", 10) || 1; // Default to 1 if page is not set or invalid
    const currentPageSize = parseInt(pageSize?.toString() || "50", 10) || 10; // Default to 10 if pageSize is not set or invalid
    const skip = (currentPage - 1) * currentPageSize; // Calculate skip based on page and pageSize

    const filter: ContactFilter = { user: headers?.userid as string };
    const contacts: Array<IContact> = await ContactModel.find(filter)
      .sort({ ["lastname"]: 1 })
      .skip(skip)
      .limit(currentPageSize);
    res.status(200).json(contacts);
  }

  public async getContactById(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    console.log("getContactById");
    const { headers } = req;
    const { id } = req.params;
    const contact: IContact | null = await ContactModel.findOne({
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
      console.log("headers", headers);
      const contactCount: number = await ContactModel.countDocuments({
        user: headers?.userid,
      });
      res.status(200).json(contactCount);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting contact count" });
    }
  }

  public async createContact(req: Request, res: Response): Promise<void> {
    const contact: IContact = await ContactModel.create(req.body);
    consola.box(contact);
    res
      .status(201)
      .json({ status: 201, message: "Successfully created contact" });
  }

  public async patchContact(req: Request, res: Response): Promise<void> {
    const query = { _id: req.params.id };
    const options = { upsert: true };
    const updatedContact = req.body;

    await ContactModel.updateOne(query, updatedContact, options)
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
      await ContactModel.deleteOne(query).catch((err) =>
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
    consola.info("Initiation demo data contacts for userId: ", userid);
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
          category: "demo",
        };
      }

      for (let i = 0; i < 10; i++) {
        const contact = createRandomContact(userid);
        const res: IContact = await ContactModel.create(contact);
        consola.info("res", res);
      }
      res.status(200).json({
        status: 200,
        message: `Successfully delete created demo contacts`,
      });
    } catch (error) {
      consola.error("error", error);
    }
  }

  public async deleteDemoContacts(req: Request, res: Response): Promise<void> {
    try {
      const { headers } = req;
      consola.log("Deleting demo contacts for user: ", headers?.userid);
      const result = await ContactModel.deleteMany({
        user: headers?.userid,
        category: "demo",
      });
      consola.log("result", result);
      res.status(200).json({
        status: 200,
        message: `Successfully delete  ${result.deletedCount} demo contacts`,
      });
    } catch (error) {
      consola.error("error", error);
      res.status(500).json({ message: "Error deleting demo contacts" });
    }
  }
}
