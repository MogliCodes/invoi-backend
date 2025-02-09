import {
  body,
  header,
  validationResult,
  ValidationChain,
} from "express-validator";
import { Request, Response, NextFunction } from "express";

const incomeValidationChain: ValidationChain[] = [
  body("year").isString().notEmpty(),
  header("userid").isString().notEmpty(),
];

export const validateIncome = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  Promise.all(incomeValidationChain.map((validation) => validation.run(req)))
    .then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    })
    .catch((error) => {
      console.error("Validation middleware error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};
