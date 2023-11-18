import { Router } from "express";
import UserController from "./UserController.ts";

const userController = new UserController();
const router: Router = Router();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id", userController.patchUser);

export default router;
