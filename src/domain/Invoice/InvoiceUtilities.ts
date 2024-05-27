import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { consola } from "consola";
import StorageController from "../Storage/StorageController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type InvoiceData = {
  nr: string;
  client: string;
  title: string;
  date: string;
  performancePeriodStart: string;
  performancePeriodEnd: string;
  items: {
    position: number;
    description: string;
    hours: number;
    factor: number;
    total: number;
  }[];
  total: number;
  taxes: number;
  totalWithTaxes: number;
  isReverseChargeInvoice: boolean;
};

type ClientData = {
  company: string;
  street: string;
  zip: string;
  city: string;
};

export function transformInvoiceData(data: InvoiceData): InvoiceData {
  const transformedData = { ...data };
  transformedData.items = JSON.parse(data.items.toString());
  transformedData.date = new Date(data.date).toLocaleDateString("de-DE");
  transformedData.performancePeriodStart = new Date(
    data.performancePeriodStart,
  ).toLocaleDateString();
  transformedData.performancePeriodEnd = new Date(
    data.performancePeriodEnd,
  ).toLocaleDateString();
  // Format numbers in items array
  transformedData.items = transformedData.items?.map((item) => ({
    ...item,
    total:
      typeof item.total === "number"
        ? parseFloat(item.total.toFixed(2))
        : item.total,
  }));
  return transformedData;
}

export async function getDefaultTemplate() {
  const objectName = "template-single.html";
  consola.info(`${objectName} used`);
  return getTemplateFromStorage(objectName);
}

async function getTemplateFromStorage(objectName: string): Promise<unknown> {
  try {
    const minioClient = await StorageController.createStorageClient();
    if (!minioClient) return;
    const dataStream = await minioClient.getObject("templates", objectName);
    let templateData = "";

    return new Promise((resolve, reject) => {
      dataStream.on("data", (chunk) => {
        consola.info("chunk", chunk);
        templateData += chunk.toString();
      });

      dataStream.on("end", () => {
        resolve(templateData);
      });

      dataStream.on("error", (err) => {
        reject(`Error while reading the object: ${err}`);
      });
    });
  } catch (err) {
    consola.error("Error fetching the template from MinIO:", err);
    throw err;
  }
}

export function getSubsequentPagesTemplate() {
  consola.info("template-subsequent.html used");
  const objectName = "template-subsequent.html";
  return getTemplateFromStorage(objectName);
}

export function getLastPageTemplate() {
  consola.info("template-last-page.html used");
  const objectName = "template-last-page.html";
  return getTemplateFromStorage(objectName);
}

export function getInvoiceSenderInfoTemplate(): Promise<unknown> {
  consola.info("template-invoice-sender-info.html used");
  const objectName = "partials/template-invoice-sender-info.html";
  return getTemplateFromStorage(objectName);
}

export function saveTemplateHtml(templateHtml: any): void {
  const timestamp = new Date().toISOString().replace(/:/g, "-").slice(0, -5); // Remove seconds and replace colons with dashes

  fs.writeFileSync(
    `${__dirname}/../../../tmp/${timestamp}-output.html`,
    templateHtml,
    "utf8",
  );
}

type InvoicePosition = {
  position: number;
  description: string;
  hours: number;
  factor: number;
  total: number;
};

export function calculateInvoiceItemCharCount(item: InvoicePosition): number {
  return item.description.length;
}

export function calculatePages(
  items: InvoicePosition[],
  maxCharsPerPage: number,
) {
  let currentPageCharCount = 0;
  let totalPages = 0;

  for (const item of items) {
    const itemCharCount = calculateItemCharCount(item);

    if (currentPageCharCount + itemCharCount > maxCharsPerPage) {
      currentPageCharCount = 0;
      totalPages += 1;
    }

    currentPageCharCount += itemCharCount;
  }

  // Add the last page if there are remaining items
  if (currentPageCharCount > 0) {
    totalPages += 1;
  }

  return totalPages;
}

function calculateItemCharCount(item: InvoicePosition) {
  // Implement your logic to calculate the character count for each item
  return item.description.length;
}

export function generateFileName(
  clientData: ClientData,
  invoiceData: InvoiceData,
) {
  return `${invoiceData.nr}_${clientData.company.replace(
    / /g,
    "-",
  )}_${invoiceData.title.replace(/ /g, "-")}.pdf`;
}
