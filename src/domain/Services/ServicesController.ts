import ServicesService, { ServiceDocument } from "./ServicesService.ts";
import { consola } from "consola";
import { Request, Response } from "express";
import type {
  QueryParams,
  RequestBody,
  RequestParams,
  ResponseData,
} from "../../types.js";
export default class ServicesController {
  private static sendHttpResponse<T>(
    res: Response,
    data: Array<T> | string,
    created = false,
  ): void {
    if (created) {
      res.status(201).json({
        data: data,
        status: 201,
        message: "Successfully create a new service",
      });
      return;
    }
    if (data && data.length > 0) {
      res.status(200).json({ data: data, status: 200, total: data.length });
    } else {
      res.status(404).json({ status: 404, message: "No data found" });
    }
  }

  /**
   * @swagger
   * /services:
   *   get:
   *     tags:
   *      - Services
   *     summary: Get all services
   *     description: Returns all services
   */
  public async getAllServices(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    consola.info(req.headers);
    const { userid } = req.headers;
    const services: Array<ServiceDocument> =
      await ServicesService.getAllServices(userid as string);
    ServicesController.sendHttpResponse(res, services);
  }

  /**
   * @swagger
   * /services:
   *   post:
   *     tags:
   *      - Services
   *     summary: Create a service
   *     description: Returns created service
   */
  public async createService(
    req: Request<RequestParams, ResponseData, RequestBody, QueryParams>,
    res: Response,
  ): Promise<void> {
    const { body } = req;
    const service = await ServicesService.createService(
      body as unknown as ServiceDocument,
    );
    ServicesController.sendHttpResponse(res, service, true);
  }
}
