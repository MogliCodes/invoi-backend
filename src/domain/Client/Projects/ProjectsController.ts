import { Request, Response } from "express";
import ProjectsModel from "./ProjectsModel.ts";
export default class ProjectsController {
  async getAllProjectsByClientId(req: Request, res: Response) {
    console.log("getAllProjectsByClientId");
    const { params } = req;
    console.log(params.id);
    try {
      const projects = await ProjectsModel.find({ client: params.id });
      res.status(200).json(projects);
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }

  async getAllProjectsByUserId(req: Request, res: Response) {
    console.log("getAllProjectsByUserId");
    const { headers } = req;
    console.log(headers.userid);
    try {
      const projects = await ProjectsModel.find({ user: headers.userid });
      res.status(200).json(projects);
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }
  async createProject(req: Request, res: Response) {
    console.log("createProject");
    const { client, title, description } = req.body;
    const { headers } = req;
    console.log(headers.userid);
    console.log(req.body);
    const project = new ProjectsModel({
      client,
      title,
      description,
      user: headers.userid,
    });
    try {
      const response = await project.save();
      console.log(response);
      res.status(201).json(project);
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }
}
