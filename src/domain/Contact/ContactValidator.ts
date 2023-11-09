import { body, validationResult, ValidationChain } from "express-validator";
import { Request, Response, NextFunction } from "express";

const contactValidationChain: ValidationChain[] = [
  body("firstname").isString().notEmpty(),
  body("lastname").isString().notEmpty(),
  body("street").isString().notEmpty(),
  body("zip").isString().notEmpty(),
  body("city").isString().notEmpty(),
];

export const validateContact = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.log("req.body", req.body);
  Promise.all(contactValidationChain.map((validation) => validation.run(req)))
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
