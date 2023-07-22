import { Request, Response } from "express";
import UserModel from "./UserModel.ts";

export default class UserController {
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    const users = await UserModel.find();
    console.log("users", users);
    res.status(200).json(users);
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    res.status(200).json(user);
  }
}
