import ServicesModel from "./ServicesModel.ts";
import { consola } from "consola";
import type { RequestBody } from "../../types.js";

export interface ServiceDocument {
  name: string;
  description: string | undefined;
  price: number;
  user: string;
}
export default class ServicesService {
  public static async getAllServices(
    userId: string,
  ): Promise<Array<ServiceDocument>> {
    return ServicesModel.find({ user: userId });
  }
  public static async createService(body: ServiceDocument): Promise<any> {
    console.log("body", body);
    return await ServicesModel.create({
      name: body.name,
      description: body.description,
      price: body.price,
      user: body.user,
    });
  }
}
