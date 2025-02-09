import { Router } from "express";
import IncomeController from "./IncomeController.ts";
import { validateIncome } from "./IncomeValidator.ts";

const incomeController = new IncomeController();
const router: Router = Router();

// Create data
router.post("/isc", validateIncome, incomeController.createIsc);

export default router;
