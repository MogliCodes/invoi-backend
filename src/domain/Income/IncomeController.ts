import { Request, Response } from "express";
import { consola } from "consola";
import InvoiceModel from "../Invoice/InvoiceModel.ts";
import fs from "fs";
import StorageController from "../Storage/StorageController.ts";
import type { CustomHeaders } from "../../types.d.ts";

export default class IncomeController {
  public async createIsc(req: Request, res: Response): Promise<void> {
    try {
      const headers = req.headers as unknown as CustomHeaders;
      const userId: string = headers.userid || "";
      const { year } = req.body;
      consola.info("Starting to create income surplus calculation for", year);

      // Get all invoices for the year
      const queryParams: Record<string, unknown> = {
        user: req.headers?.userid || "",
      };
      const options: Record<string, unknown> = {
        ...(year && { nr: { $regex: new RegExp(`^${year}-\\d+$`) } }), // Add `nr` filter if `year` is provided
      };

      const invoices = await InvoiceModel.find({
        ...options,
        ...queryParams,
      }).sort({ ["nr"]: 1 });

      consola.info("Found invoices", invoices);

      // Calculate the total, taxes and net income
      const total = invoices.reduce(
        (acc, invoice) => acc + parseFloat(invoice.total ?? ""),
        0,
      );
      const taxes = invoices.reduce(
        (acc, invoice) => acc + parseFloat(invoice.taxes ?? ""),
        0,
      );
      const netIncome = invoices.reduce(
        (acc, invoice) => acc + parseFloat(invoice.totalWithTaxes ?? ""),
        0,
      );

      // Create an array that contains an object for each invoice and last row with the total, taxes and net income
      const table = invoices.map((invoice) => {
        return {
          nr: invoice.nr,
          total: (Number(invoice.total) / 100).toFixed(2),
          taxes: (Number(invoice.taxes) / 100).toFixed(2),
          totalWithTaxes: (Number(invoice.totalWithTaxes) / 100).toFixed(2),
        };
      });
      table.push({
        nr: "Total",
        total: (total / 100).toFixed(2).toString(),
        taxes: (taxes / 100).toFixed(2).toString(),
        totalWithTaxes: (netIncome / 100).toFixed(2).toString(),
      });
      console.log(table);

      // Create table file and save it to the database
      const csvHeaders = "Rechnungsnummer,Netto,Mwst.,Brutto";
      const csvRows = table
        .map((row) => {
          const temp = Object.values(row).join(",");
          console.log("temp", temp);
          return temp;
        })
        .join("\n");

      console.log(csvHeaders);
      console.log("Rows", csvRows);
      const csvData = `${csvHeaders}\n${csvRows}`;
      console.log(csvData);

      // Create a buffer and than upload to min.io
      const buffer = Buffer.from(csvData);
      const fileName = `income-surplus/${year}/${year}-income-surplus-calculation.csv`;
      const bucketName: string = userId;

      const minioClient = await StorageController.createStorageClient();
      if (!minioClient) {
        const error = new Error("Failed to create MinIO client");
        console.error(error);
        return;
      }
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
      }
      await minioClient.putObject(bucketName, fileName, buffer);

      res.status(200).json({
        status: 200,
        total: total,
        taxes: taxes,
        netIncome: netIncome,
        message: `Successfully created income surplus calculation for ${year}`,
      });
    } catch (error) {
      consola.error("Error creating income surplus calculation", error);
      res.status(500).json({
        status: 500,
        message: "Internal Server Error",
      });
    }
  }
}
