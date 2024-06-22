import { Request, Response } from "express";
import ProjectsModel from "./ProjectsModel.ts";

type Filter = {
  client?: string;
  user: string;
};
// extend header type
declare global {
  namespace Express {
    interface Request {
      headers: {
        userid: string;
      };
    }
  }
}

export default class ProjectsController {
  async getAllProjectsByClientId(req: Request, res: Response) {
    const { params } = req;
    try {
      const projects = await ProjectsModel.find({ client: params.id });
      res.status(200).json(projects);
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }

  async getAllProjectsByUserId(req: Request, res: Response) {
    const { userid } = req.headers;
    if (!userid) return;
    try {
      // Retrieve query parameters if needed
      const { clientId, queryParam2 } = req.query;

      // Prepare the filter object
      const filter: Filter = { user: userid as string };

      // Add query parameters to filter if they exist
      if (clientId) {
        filter.client = clientId as string;
      }

      const projects = await ProjectsModel.find(filter);
      res.status(200).json(projects);
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }
  async createProject(req: Request, res: Response) {
    const { client, title, description } = req.body;
    const { headers } = req;
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

  async deleteProject(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await ProjectsModel.deleteOne({ _id: id });
      console.log(response);
      res.status(200).json({ message: "Project deleted" });
    } catch (error) {
      // @ts-ignore
      res.status(500).json({ message: error.message });
    }
  }
}
