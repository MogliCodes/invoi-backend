import { Router } from "express";
import UserController from "./UserController.ts";

const userController = new UserController();
const router: Router = Router();

router.get("/", userController.getAllUsers);

export default router;
