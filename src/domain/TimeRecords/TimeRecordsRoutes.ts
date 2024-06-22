import { Router, Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import timeRecordsValidationRules from "./TimeRecordsValidator.ts";
import TimeRecordsController from "./TimeRecordsController.ts";
import mongoose from "mongoose";

const router: Router = Router();

const { ObjectId } = mongoose.Types;

function logBody() {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("body", req.body);
    const validProjectId = ObjectId.isValid(req.body.projectId)
      ? new mongoose.Types.ObjectId(req.body.projectId)
      : null;

    console.log("validProjectId", validProjectId);
    next();
  };
}

router.get("/", TimeRecordsController.getAllTimeRecords);
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  TimeRecordsController.createTimeRecord,
);

router.patch("/:id", logBody(), TimeRecordsController.updateTimeRecord);

export default router;
