import { Request, Response } from "express";
import UserModel from "./UserModel.ts";
import ContactModel from "../Contact/ContactModel.js";

export default class UserController {
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    const users = await UserModel.find();
    res.status(200).json(users);
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    res.status(200).json(user);
  }

  public async patchUser(req: Request, res: Response): Promise<void> {
    const query = { _id: req.params.id };
    const options = { upsert: true };
    const updatedContact = req.body;

    const result = UserModel.updateOne(query, updatedContact, options)
      .then((result) => {
        const { matchedCount, modifiedCount } = result;
        if (matchedCount && modifiedCount) {
          console.log(`Successfully patched user.`);
        }
      })
      .catch((err) => console.error(`Failed to patch user: ${err}`));
    res
      .status(200)
      .json({ status: 200, message: "Successfully patched contact" });
  }
}
