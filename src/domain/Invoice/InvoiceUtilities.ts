import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
};

export function transformInvoiceData(data: InvoiceData): InvoiceData {
  const transformedData = { ...data };

  console.log("transformedData", transformedData);
  // Convert date strings to human-readable format
  transformedData.items = JSON.parse(data.items.toString());
  console.log("transformData", transformedData);
  transformedData.date = new Date(data.date).toLocaleDateString();
  transformedData.performancePeriodStart = new Date(
    data.performancePeriodStart,
  ).toLocaleDateString();
  transformedData.performancePeriodEnd = new Date(
    data.performancePeriodEnd,
  ).toLocaleDateString();

  // Format numbers to two decimal places
  transformedData.total =
    typeof data.total === "number"
      ? parseFloat(data.total.toFixed(2))
      : data.total;
  transformedData.taxes =
    typeof data.taxes === "number"
      ? parseFloat(data.taxes.toFixed(2))
      : data.taxes;
  transformedData.totalWithTaxes =
    typeof data.totalWithTaxes === "number"
      ? parseFloat(data.totalWithTaxes.toFixed(2))
      : data.totalWithTaxes;

  // Optionally, you can format other numeric properties in the object as needed

  // Format numbers in items array
  transformedData.items = transformedData.items?.map((item) => ({
    ...item,
    total:
      typeof item.total === "number"
        ? parseFloat(item.total.toFixed(2))
        : item.total,
  }));
  console.log("IN METHOD", transformedData);
  return transformedData;
}

export function getDefaultTemplate(): string {
  return fs.readFileSync(`${__dirname}/template-single.html`, "utf8");
}

export function getSubsequentPagesTemplate(): string {
  return fs.readFileSync(`${__dirname}/template-subsequent.html`, "utf8");
}

export function getLastPageTemplate(): string {
  return fs.readFileSync(`${__dirname}/template-last-page.html`, "utf8");
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
