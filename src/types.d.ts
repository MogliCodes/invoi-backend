import { Document } from "mongoose";

export interface ParsedInvoice extends Document {
  Dateiname: string;
  Kunde: string;
  Projekt: string;
  Rechnungsnummer: string;
  Rechnungsdatum: string;
  "Mwst.": string;
  "Netto-Rechnungssume": string;
  "Brutto-Rechnungssume": string;
  user: string;
}

export type InvoiceModel = {
  nr: string;
  client: string;
  title: string;
  date: Date;
};

export type InvoicePosition = {
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

export type InvoiceCsvData = {
  nr: string;
  client: string;
  title: string;
  date: Date;
  total: string;
  taxes: string;
  totalWithTaxes: string;
  user: string;
};

export type CsvData = {
  data: Array<ParsedInvoice>;
};

export interface RequestParams {
  id: string;
}

export interface QueryParams {
  page: number;
  pageSize: number;
}

export interface RequestBody {
  key: string;
  value: string;
}

export interface ResponseData {
  message: string;
}

export type ClientData = {
  company: string;
  street: string;
  zip: string;
  city: string;
};

interface CustomHeaders extends Headers {
  userid?: string;
}

export interface RequestParams {
  id: string;
}

export interface QueryParams {
  page: number;
  pageSize: number;
  search: string;
}

export interface RequestBody {
  key: string;
  value: string;
}

export interface ResponseData {
  message: string;
}
