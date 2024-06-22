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

      const filter = {};
      if (headers.userid) {
        // @ts-ignore
        filter["userId"] = headers.userid;
      }
      if (req.query.clientId) {
        // @ts-ignore
        filter["clientId"] = req.query.clientId;
      }

      if (req.query.projectId) {
        // @ts-ignore
        filter["projectId"] = req.query.projectId;
      }

      const timeRecords = await TimeRecord.find(filter);
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
      const newTimeRecord = new TimeRecord({
        userId,
        clientId,
        projectId,
        serviceId,
        startTime,
        endTime,
        description,
      });
      const response = TimeRecordsModel.create(newTimeRecord);
      res.status(201).json(newTimeRecord);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }

  public static async updateTimeRecord(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;
      console.log("id", id);
      const {
        userId,
        clientId,
        projectId,
        serviceId,
        startTime,
        endTime,
        description,
      } = req.body;
      console.log("req.body", req.body);
      const updatedTimeRecord = await TimeRecordsModel.updateOne(
        { _id: id },
        {
          startTime,
          endTime,
        },
        { upsert: true },
      );
      console.log("updatedTimeRecord", updatedTimeRecord);

      res.status(200).json(updatedTimeRecord);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
}
