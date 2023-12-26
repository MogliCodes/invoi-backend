import { Request, Response } from "express";
import SettingsModel from "./SettingsModel.ts";
export default class SettingsController {
  public async getSettings(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const settings = await SettingsModel.findOne({ user: headers.userid });
    res.status(200).json({ message: "getSettings", data: settings });
  }
  public async createSettings(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const settings = await SettingsModel.create({
      ...req.body,
      user: headers.userid,
    });
    res.status(201).json({ message: "createSettings", data: settings });
  }
}
