import { body } from "express-validator";

const timeRecordsValidationRules = () => {
  return [
    body("userId").isMongoId().withMessage("Invalid userId"),
    body("clientId").isMongoId().withMessage("Invalid clientId"),
    body("projectId").isMongoId().withMessage("Invalid projectId"),
    body("serviceId").isMongoId().withMessage("Invalid serviceId"),
    body("startTime").isISO8601().toDate().withMessage("Invalid startTime"),
    body("endTime").isISO8601().toDate().withMessage("Invalid endTime"),
  ];
};

export default timeRecordsValidationRules;
