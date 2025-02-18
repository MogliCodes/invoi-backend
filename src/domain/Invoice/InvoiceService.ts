import { fileURLToPath } from "url";
import { dirname } from "path";
import { Browser, chromium } from "playwright";
import handlebars from "handlebars";
import {
  calculateInvoiceItemCharCount,
  calculatePages,
  generateFileName,
  getDefaultTemplate,
  getLastPageTemplate,
  getSenderPartialTemplate,
  getSubsequentPagesTemplate,
  transformInvoiceData,
  getCustomTemplateFromStorage,
} from "./InvoiceUtilities.ts";
import { consola } from "consola";
import fs from "fs";
import ClientModel, { IClient } from "../Client/ClientModel.ts";
import SettingsModel, { ISettings } from "../Settings/SettingsModel.ts";
import ContactModel, { IContact } from "../Contact/ContactModel.ts";
import TemplatesModel, { ITemplate } from "./TemplatesModel.ts";
import StorageController from "../Storage/StorageController.ts";
// eslint-disable-next-line node/no-missing-import
import { isEmptyObject } from "../../app/utils/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  contact?: string;
  title: string;
  date: string;
  performancePeriodStart: string;
  performancePeriodEnd: string;
  items: Array<InvoicePosition>;
  total: number;
  taxes: number;
  totalWithTaxes: number;
  isReverseChargeInvoice: boolean;
  user?: string;
};

type ClientData = {
  company: string;
  street: string;
  zip: string;
  city: string;
  taxId: string;
};

export interface FetchDataForInvoiceCreationResponse {
  data: {
    clientData: IClient;
    settingsData: ISettings | null;
    contactData: IContact | null;
    customTemplates?: Array<ITemplate>;
    customTemplatesHtml?: Array<string>;
  } | null;
  status: number;
  message: string;
}

export default class InvoiceService {
  static async createPdf(
    invoiceData: InvoiceData,
    clientData: IClient,
    settingsData: ISettings,
    contactData: IContact | boolean,
    customTemplates?: Array<ITemplate>,
  ): Promise<Buffer> {
    const maxCharsPerPage = 900;
    const itemsForOnePage: InvoicePosition[] = [];

    let currentPageChars = 0;
    let currentPageIndex = 0;

    // TODO: Make this more elegant
    const transformedInvoiceData = transformInvoiceData(invoiceData);
    const { isReverseChargeInvoice } = transformedInvoiceData;
    const numberOfPages = calculatePages(
      transformedInvoiceData.items,
      maxCharsPerPage,
    );
    // TODO END

    if (customTemplates) {
      const hasCustomTemplates = !isEmptyObject(customTemplates);
      console.log("hasCustomTemplates", hasCustomTemplates);
    }

    console.info("customTemplates", customTemplates);
    console.info("typeof customTemplates", typeof customTemplates);
    consola.info("Has custom templates: ", !!customTemplates);
    consola.info("Has contact data: ", !!contactData);
    consola.info(
      isReverseChargeInvoice ? "Reverse charged invoice" : "Standard invoice",
    );

    // Create a browser instance
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });

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
        try {
          const pageHtml = await this.processItemsForPage(
            itemsForOnePage,
            currentPageIndex,
            transformedInvoiceData,
            browser,
            numberOfPages,
            subtotal,
            clientData,
            settingsData,
            contactData ? contactData : false,
            customTemplates,
          );
          allPagesHtml += pageHtml;
        } catch (e) {
          console.error("Error processing items for page", e);
        }

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
      contactData,
      customTemplates,
    );
    allPagesHtml += lastPageHtml;

    // Close the browser
    await browser.close();

    return await this.generatePdfBuffer(allPagesHtml);
  }

  static async getTemplate(
    isLastPage: boolean,
    isSinglePage: boolean,
    currentPageIndex: number,
    customTemplates: any,
    userId: string,
  ) {
    console.log("isLastPage", isLastPage);
    console.log("isSinglePage", isSinglePage);
    console.log("currentPageIndex", currentPageIndex);

    try {
      let templateSource;

      if ((customTemplates as Array<unknown>).length == 1 && userId) {
        const objectName = `templates/${customTemplates[0]?.fileName || ""}`;
        templateSource = await getCustomTemplateFromStorage(userId, objectName);
      } else {
        if (isLastPage && !isSinglePage) {
          templateSource = await getLastPageTemplate();
        } else if (currentPageIndex === 1 && isSinglePage) {
          console.log("Getting default template");
          templateSource = await getDefaultTemplate();
        } else {
          templateSource = await getSubsequentPagesTemplate();
        }
      }

      // Ensure template source is valid before compiling
      if (!templateSource) {
        throw new Error("Template source is undefined or invalid");
      }

      // Compile the template with no escape option
      return handlebars.compile(templateSource, { noEscape: true });
    } catch (error) {
      console.error("Error fetching or compiling template:", error);
      throw error; // Rethrow the error after logging it
    }
  }

  static async processItemsForPage(
    itemsForOnePage: InvoicePosition[],
    currentPageIndex: number,
    invoiceData: InvoiceData,
    browser: Browser,
    numberOfPages: number,
    subtotal: number = 0,
    client: IClient,
    settingsData: ISettings,
    contactData: IContact | boolean,
    customTemplates: Array<ITemplate> = [],
  ): Promise<string> {
    const page = await browser.newPage();
    const isLastPage = currentPageIndex === numberOfPages;
    const isSinglePage = numberOfPages === 1;
    const invoiceSenderInfoTemplate = await getSenderPartialTemplate();
    console.log("invoiceSenderInfoTemplate", invoiceSenderInfoTemplate);

    console.log("invoiceData", invoiceData?.user);

    if (customTemplates.length > 1) {
      console.log("More than one custom template");
    }

    if (customTemplates.length === 1) {
      consola.info(
        "Exactly one custom template: " + customTemplates[0].fileName,
      );
      console.log("customTemplates[0]", customTemplates[0].user);
    }

    if (!customTemplates.length) {
      console.log("No custom templates");
    }

    console.info("Trying to register partials", invoiceSenderInfoTemplate);
    try {
      handlebars.registerPartial(
        "invoiceSenderInfo",
        <Handlebars.TemplateDelegate | string>invoiceSenderInfoTemplate,
      );
    } catch (e) {
      console.error("Error registering partials", e);
    }

    // TODO: extract to own function
    const template = await InvoiceService.getTemplate(
      isLastPage,
      isSinglePage,
      currentPageIndex,
      customTemplates,
      invoiceData?.user || "",
    );
    //   isLastPage && !isSinglePage
    //     ? handlebars.compile(await getLastPageTemplate(), { noEscape: true })
    //     : currentPageIndex === 1 && isSinglePage
    //     ? handlebars.compile(await getDefaultTemplate(), { noEscape: true })
    //     : handlebars.compile(await getSubsequentPagesTemplate(), {
    //         noEscape: true,
    //       });

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

    function getContactName(contactData: IContact | boolean): string | boolean {
      if (contactData && typeof contactData !== "boolean") {
        return `${contactData.firstname} ${contactData.lastname}`;
      }
      return false;
    }

    const contactName = getContactName(contactData);

    const additionalText = invoiceData.isReverseChargeInvoice
      ? additionalTextReverseCharge
      : additionalTextDefault;
    // Render the template
    const html = template({
      company: client.company,
      street: client.street,
      taxId: client.taxId,
      zip: client.zip,
      city: client.city,
      nr: invoiceData.nr,
      contact: contactName,
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
      userVatId: settingsData.vatId,
    });

    await page.setContent(html);
    await page.evaluateHandle("document.fonts.ready");

    await page.close();

    return html;
  }

  static async savePdf(
    allPagesHtml: string,
    timestamp: number,
    clientData: ClientData,
    invoiceData: InvoiceData,
  ): Promise<string> {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
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
    await page.evaluateHandle("document.fonts.ready");
    await page.pdf({
      path: path,
      format: "a4",
    });
    await browser.close();

    return path;
  }

  static async generatePdfBuffer(allPagesHtml: string): Promise<Buffer> {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    const page = await browser.newPage();
    await page.setContent(allPagesHtml);
    const pdfBuffer: Buffer = await page.pdf({
      format: "a4",
    });
    await browser.close();

    return pdfBuffer;
  }

  static async fetchDataForInvoiceCreation(
    userId: string,
    clientId: string,
    contactId: string,
  ): Promise<FetchDataForInvoiceCreationResponse> {
    if (!userId || !clientId) {
      return { data: null, status: 400, message: "Missing parameters" };
    }
    if (!contactId) {
      consola.info("Invoice without contact");
    }

    const clientData: IClient | null = await ClientModel.findOne({
      user: userId,
      _id: clientId,
    });
    if (!clientData) {
      return { data: null, status: 404, message: "Client not found" };
    }
    consola.success(
      "Successfully fetched client data for client: ",
      clientData.company,
    );

    const settingsData: ISettings | null = await SettingsModel.findOne({
      user: userId,
    });
    if (!settingsData) {
      return { data: null, status: 404, message: "Settings not found" };
    }
    consola.success(
      "Successfully fetched settings data for user: ",
      settingsData.username,
    );

    let contactData: IContact | null = null;
    if (contactId) {
      contactData = await ContactModel.findOne({
        user: userId,
        _id: contactId,
      });
      if (contactData) {
        consola.success(
          "Successfully fetched contact data for contact: ",
          `${contactData.firstname} ${contactData.lastname}`,
        );
      }
    } else {
      consola.info("Invoice without contact");
    }

    /* ===================================
    // Fetch custom templates information
    =================================== */
    const customTemplates = await TemplatesModel.find({
      user: userId,
    });
    if (!customTemplates) {
      console.info("No custom templates found");
      return {
        data: {
          clientData,
          settingsData,
          contactData,
        },
        status: 200,
        message: "Data retrieved successfully",
      };
    } else {
      consola.success("Successfully fetched custom templates information:");
      consola.box(customTemplates);
    }

    /* ===================================
    // Fetch custom templates HTML
    =================================== */
    const minioClient = await StorageController.createStorageClient();
    const customTemplatesHtml: Array<string> = [];
    if (!!customTemplates.length && minioClient) {
      for (const template of customTemplates) {
        // TODO: Extract to own function for getting template html
        const dataStream = await minioClient.getObject(
          userId,
          "templates/" + template.fileName,
        );
        let templateData = "";

        dataStream.on("data", (chunk) => {
          templateData += chunk.toString();
        });

        dataStream.on("end", () => {
          customTemplatesHtml.push(templateData);
          consola.success(
            `Successfully fetched template data for: ${template.fileName}`,
          );
        });

        dataStream.on("error", (err) => {
          consola.error(`Error while reading the object: ${err}`);
        });
        // TODO END
      }
    }

    return {
      data: {
        clientData,
        settingsData,
        contactData,
        customTemplates,
        customTemplatesHtml,
      },
      status: 200,
      message: "Data retrieved successfully",
    };
  }
}
