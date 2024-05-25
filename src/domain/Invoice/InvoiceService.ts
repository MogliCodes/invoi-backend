import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { Browser, chromium } from "playwright";
import handlebars from "handlebars";
import {
  calculateInvoiceItemCharCount,
  calculatePages,
  generateFileName,
  getDefaultTemplate,
  getInvoiceSenderInfoTemplate,
  getLastPageTemplate,
  getSubsequentPagesTemplate,
  transformInvoiceData,
} from "./InvoiceUtilities.ts";
import { consola } from "consola";
import fs from "fs";

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
  isReverseChargeInvoice: boolean;
};

type ClientData = {
  company: string;
  street: string;
  zip: string;
  city: string;
};

export default class InvoiceService {
  static async createPdf(
    invoiceData: InvoiceData,
    clientData: ClientData | any,
    settingsData: any,
  ): Promise<string> {
    const maxCharsPerPage = 900;
    let currentPageChars = 0;
    let currentPageIndex = 0;
    const itemsForOnePage: InvoicePosition[] = [];
    const transformedInvoiceData = transformInvoiceData(invoiceData);
    const { isReverseChargeInvoice } = transformedInvoiceData;
    const numberOfPages = calculatePages(
      transformedInvoiceData.items,
      maxCharsPerPage,
    );

    consola.info(
      isReverseChargeInvoice ? "Reverse charged invoice" : "Normal invoice",
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
          settingsData,
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
      settingsData,
    );
    allPagesHtml += lastPageHtml;

    // Close the browser
    await browser.close();

    // Save the complete PDF
    const timestamp = Date.now();
    return await this.savePdf(allPagesHtml, timestamp, clientData, invoiceData);
  }

  static async processItemsForPage(
    itemsForOnePage: InvoicePosition[],
    currentPageIndex: number,
    invoiceData: InvoiceData,
    browser: Browser,
    numberOfPages: number,
    subtotal: number = 0,
    client: ClientData,
    settingsData: any,
  ): Promise<string> {
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
        hours: (item.hours / 100).toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        }),
        total: (item.total / 100).toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        }),
      };
    });

    const additionalTextDefault = `Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen nach Erhalt dieser Rechnung. Wir danken für Ihren Auftrag und wünschen weiterhin gute Zusammenarbeit.`;
    const additionalTextReverseCharge = `Die Steuerschuld geht auf den Leistungsempfänger über. Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen nach Erhalt
dieser Rechnung. Wir danken für Ihren Auftrag und wünschen weiterhin gute Zusammenarbeit.`;

    const additionalText = invoiceData.isReverseChargeInvoice
      ? additionalTextReverseCharge
      : additionalTextDefault;
    console.log("settingsData", settingsData);
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
      additionalText: additionalText,
      userFullName: `${settingsData.firstname} ${settingsData.lastname}`,
      userStreet: settingsData.street,
      userZipCode: settingsData.zipCode,
      userCity: settingsData.city,
      userPhone: settingsData.phone,
      userEmail: settingsData.email,
      userBankName: settingsData.bankName,
      userIban: settingsData.iban,
      userBic: settingsData.bic,
      userTaxId: settingsData.taxId,
    });

    await page.setContent(html);
    await page.close();

    return html;
  }

  static async savePdf(
    allPagesHtml: string,
    timestamp: number,
    clientData: ClientData,
    invoiceData: InvoiceData,
  ): Promise<string> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fileName = generateFileName(clientData, invoiceData);
    const year = fileName.slice(0, 4);
    const yearDirectoryPath = `${__dirname}/../../../tmp/${year}`;
    const directoryForYearExists = fs.existsSync(yearDirectoryPath);
    const path = `${__dirname}/../../../tmp/${year}/${fileName}`;
    consola.log("Full path", path);
    // strip away string before /tmp but leave /tmp in the path
    const pathWithoutTmp = path.slice(path.indexOf("/tmp"));
    console.log("pathWithoutTmp", pathWithoutTmp);
    if (!directoryForYearExists) {
      fs.mkdirSync(yearDirectoryPath);
    }

    await page.setContent(allPagesHtml);
    await page.pdf({
      path: path,
      format: "a4",
    });
    await browser.close();

    return path;
  }
}
