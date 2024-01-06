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
  getInvoiceSenderInfoTemplate,
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
  static async createPdf(
    invoiceData: InvoiceData,
    clientData: any,
  ): Promise<string> {
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
          clientData,
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
      0,
      clientData,
    );
    allPagesHtml += lastPageHtml;

    // Close the browser
    await browser.close();

    // Save the complete PDF
    const timestamp = Date.now();
    return await this.savePdf(allPagesHtml, timestamp);
  }

  static async processItemsForPage(
    itemsForOnePage: InvoicePosition[],
    currentPageIndex: number,
    invoiceData: InvoiceData,
    browser: Browser,
    numberOfPages: number,
    subtotal: number = 0,
    client: any,
  ): Promise<string> {
    // Create a new page for each page
    const page = await browser.newPage();

    const isLastPage = currentPageIndex === numberOfPages;
    const isSinglePage = numberOfPages === 1;

    const invoiceSenderInfoTemplate = getInvoiceSenderInfoTemplate();
    handlebars.registerPartial("invoiceSenderInfo", invoiceSenderInfoTemplate);

    const template =
      isLastPage && !isSinglePage
        ? handlebars.compile(getLastPageTemplate(), { noEscape: true })
        : currentPageIndex === 1 && isSinglePage
        ? handlebars.compile(getDefaultTemplate(), { noEscape: true })
        : handlebars.compile(getSubsequentPagesTemplate(), { noEscape: true });

    const formattedItems = itemsForOnePage.map((item) => {
      return {
        ...item,
        factor: item.factor.toLocaleString("de-DE"),
        hours: item.hours.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        }),
        total: (item.total / 100).toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        }),
      };
    });

    // Render the template
    const html = template({
      company: client.company,
      street: client.street,
      zip: client.zip,
      city: client.city,
      nr: invoiceData.nr,
      title: invoiceData.title,
      date: invoiceData.date,
      performancePeriodStart: invoiceData.performancePeriodStart,
      performancePeriodEnd: invoiceData.performancePeriodEnd,
      items: formattedItems,
      currentPage: currentPageIndex,
      pageCount: numberOfPages,
      total: (invoiceData.total / 100).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      }),
      taxes: (invoiceData.taxes / 100).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      }),
      totalWithTaxes: (invoiceData.totalWithTaxes / 100).toLocaleString(
        "de-DE",
        { style: "currency", currency: "EUR" },
      ),
      subtotal: subtotal.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      }),
    });

    // Set the page content
    await page.setContent(html);

    // Close the page
    await page.close();

    return html;
  }

  static async savePdf(
    allPagesHtml: string,
    timestamp: number,
  ): Promise<string> {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set the page content
    await page.setContent(allPagesHtml);

    const path = `${__dirname}/../../../tmp/invoice-all-pages-${timestamp}.pdf`;
    // Create the PDF
    await page.pdf({
      path: path,
      format: "a4",
    });

    // Close the browser
    await browser.close();

    return path;
  }
}
