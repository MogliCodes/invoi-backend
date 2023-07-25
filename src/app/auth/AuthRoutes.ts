import { Router } from "express";
import AuthController from "./AuthController.ts";

const authController = new AuthController();
const router: Router = Router();

router.post("/register", authController.register);

// Middleware to authenticate the user and generate a token
router.post("/login", authController.login);

export default router;
