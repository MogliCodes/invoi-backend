import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { Browser, chromium } from "playwright";
import handlebars from "handlebars";
import {
  calculateInvoiceItemCharCount,
  calculatePages,
  getDefaultTemplate,
  getLastPageTemplate,
  getSubsequentPagesTemplate,
  transformInvoiceData,
} from "./InvoiceUtilities.ts";

type InvoicePosition = {
  position: number;
  description: string;
  hours: number;
  factor: number;
  total: number;
};

type InvoiceData = {
  nr: string;
  client: string;
  title: string;
  date: string;
  performancePeriodStart: string;
  performancePeriodEnd: string;
  items: Array<InvoicePosition>;
  total: number;
  taxes: number;
  totalWithTaxes: number;
};

export default class InvoiceService {
  static async createPdf(invoiceData: InvoiceData): Promise<void> {
    const maxCharsPerPage = 900;
    let currentPageChars = 0;
    let currentPageIndex = 0;
    // Accumulate items for one page
    const itemsForOnePage: InvoicePosition[] = [];

    // Transform the invoice data
    const transformedInvoiceData = transformInvoiceData(invoiceData);
    console.log("transformedInvoiceData", transformedInvoiceData);
    const numberOfPages = calculatePages(
      transformedInvoiceData.items,
      maxCharsPerPage,
    );

    // Create a browser instance
    const browser = await chromium.launch();

    let allPagesHtml = "";

    // Loop through the items
    for (const item of transformedInvoiceData.items) {
      // Calculate the item's char count
      const itemCharCount = calculateInvoiceItemCharCount(item);

      if (currentPageChars + itemCharCount > maxCharsPerPage) {
        // If adding the current item exceeds the limit, start a new page
        currentPageIndex++;
        currentPageChars = 0;

        // Calculate subtotal from itemsForOnePage
        const subtotal = itemsForOnePage.reduce(
          (acc, item) => acc + item.total,
          0,
        );

        // Process items for the previous page
        const pageHtml = await this.processItemsForPage(
          itemsForOnePage,
          currentPageIndex,
          transformedInvoiceData,
          browser,
          numberOfPages,
          subtotal,
        );
        allPagesHtml += pageHtml;

        // Clear the accumulated items for the next page
        itemsForOnePage.length = 0;
      }

      // Add the item to the current page
      itemsForOnePage.push(item);
      currentPageChars += itemCharCount;
    }
    currentPageIndex++;
    // Process the remaining items for the last page
    const lastPageHtml = await this.processItemsForPage(
      itemsForOnePage,
      currentPageIndex,
      transformedInvoiceData,
      browser,
      numberOfPages,
    );
    allPagesHtml += lastPageHtml;

    // Close the browser
    await browser.close();

    // Save the complete PDF
    const timestamp = Date.now();
    await this.savePdf(allPagesHtml, timestamp);
  }

  static async processItemsForPage(
    itemsForOnePage: InvoicePosition[],
    currentPageIndex: number,
    invoiceData: InvoiceData,
    browser: Browser,
    numberOfPages: number,
    subtotal: number = 0,
  ): Promise<string> {
    // Create a new page for each page
    const page = await browser.newPage();

    const isLastPage = currentPageIndex === numberOfPages;

    const template = isLastPage
      ? handlebars.compile(getLastPageTemplate())
      : currentPageIndex === 1
      ? handlebars.compile(getDefaultTemplate())
      : handlebars.compile(getSubsequentPagesTemplate());

    // Render the template
    const html = template({
      nr: invoiceData.nr,
      client: invoiceData.client,
      title: invoiceData.title,
      date: invoiceData.date,
      performancePeriodStart: invoiceData.performancePeriodStart,
      performancePeriodEnd: invoiceData.performancePeriodEnd,
      items: itemsForOnePage,
      currentPage: currentPageIndex,
      pageCount: numberOfPages,
      total: invoiceData.total,
      taxes: invoiceData.taxes,
      totalWithTaxes: invoiceData.totalWithTaxes,
      subtotal: subtotal,
    });

    // Set the page content
    await page.setContent(html);

    // Close the page
    await page.close();

    return html;
  }

  static async savePdf(allPagesHtml: string, timestamp: number): Promise<void> {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set the page content
    await page.setContent(allPagesHtml);

    // Create the PDF
    await page.pdf({
      path: `${__dirname}/../../../tmp/invoice-all-pages-${timestamp}.pdf`,
      format: "a4",
    });

    // Close the browser
    await browser.close();
  }
}
