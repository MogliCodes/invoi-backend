import { Request, Response } from "express";
import SettingsModel from "./SettingsModel.ts";
import { consola } from "consola";
export default class SettingsController {
  public async getSettings(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const settings = await SettingsModel.findOne({ user: headers.userid });
    res.status(200).json({ message: "getSettings", data: settings });
  }
  public async createSettings(req: Request, res: Response): Promise<void> {
    const { headers } = req;
    const settings = {
      ...req.body,
      user: headers.userid,
    };
    const createdSettings = await SettingsModel.create(settings);
    res.status(201).json({
      message: "Voreinstellungen wurden erfolgreich erstellt.",
      data: createdSettings,
      status: 201,
    });
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { headers } = req;
      const settings = await SettingsModel.findOneAndUpdate(
        { user: headers.userid },
        req.body,
        { new: true },
      );
      res
        .status(201)
        .json({ status: 201, message: "updateSettings", data: settings });
    } catch (error: unknown) {
      consola.error("Error while updating settings");
      // @ts-ignore
      res.status(500).json({ status: 500, message: error.message });
    }
  }
}
