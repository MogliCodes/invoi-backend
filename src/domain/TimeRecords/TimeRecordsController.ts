import { Request, Response } from "express";
import TimeRecord from "./TimeRecordsModel.js";
import mongoose from "mongoose";
import TimeRecordsModel from "./TimeRecordsModel.js";

export default class TimeRecordsController {
  public static async getAllTimeRecords(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { headers } = req;
      console.log("headers", headers);
      console.log("userid", headers.userid);
      const timeRecords = await TimeRecord.find({ userId: headers.userid });
      res.status(200).json(timeRecords);
    } catch (error: unknown) {
      let message = "Unknown Error";
      if (error instanceof Error) {
        message = error.message;
        res.status(500).json({ message });
        return;
      }
      res.status(500).json({ message });
    }
  }

  public static async createTimeRecord(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const {
        userId,
        clientId,
        projectId,
        serviceId,
        startTime,
        endTime,
        description,
      } = req.body;
      console.log("body", req.body);
      console.log("=================");
      const newTimeRecord = new TimeRecord({
        userId,
        clientId,
        projectId,
        serviceId,
        startTime,
        endTime,
        description,
      });

      console.log("newTimeRecord", newTimeRecord);

      const response = TimeRecordsModel.create(newTimeRecord);
      console.log("response", response);
      res.status(201).json(newTimeRecord);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
}
