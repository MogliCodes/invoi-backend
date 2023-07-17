import { Request, Response } from "express";

export default class AppController {
  public async getAppInfo(req: Request, res: Response): Promise<void> {
    res.send("This is the invoi backend");
  }
}
