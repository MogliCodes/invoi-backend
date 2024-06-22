import { Router } from "express";
import ProjectsController from "./ProjectsController.ts";

const projectsController = new ProjectsController();
const router: Router = Router();

router.get("/client/:id", projectsController.getAllProjectsByClientId);
router.get("/", projectsController.getAllProjectsByUserId);
router.post("/", projectsController.createProject);
router.delete("/:id", projectsController.deleteProject);

export default router;
