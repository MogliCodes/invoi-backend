import { Router } from "express";
import SettingsController from "./SettingsController.ts";

const settingsController = new SettingsController();
const router: Router = Router();

router.get("/", settingsController.getSettings);
router.post("/", settingsController.createSettings);
