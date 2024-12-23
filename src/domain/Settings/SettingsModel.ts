import mongoose, { Document, Model, Schema } from "mongoose";

// Define an interface representing a Settings document in MongoDB
export interface ISettings extends Document {
  user: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  companyEmail?: string;
  street: string;
  zipCode: string;
  city: string;
  phone?: string;
  taxId?: string;
  vatId?: string;
  bankName: string;
  iban: string;
  bic: string;
  currency: string;
  language: string;
  invoiceNumberSchema?: string;
  additionalTextForEndOfInvoices?: string;
  additionalTextForReverseChargeInvoices?: string;
  defaultRateType?: string;
  defaultHourlyRate?: number;
  defaultDailyRate?: number;
  defaultTaxRate?: number;
}

// Define a schema for the Settings model
const settingsSchema: Schema<ISettings> = new Schema({
  user: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  company: {
    type: String,
  },
  companyEmail: {
    type: String,
  },
  street: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  city: {
    type: String,
  },
  phone: {
    type: String,
  },
  taxId: {
    type: String,
  },
  vatId: {
    type: String,
  },
  bankName: {
    type: String,
  },
  iban: {
    type: String,
  },
  bic: {
    type: String,
  },
  currency: {
    type: String,
  },
  language: {
    type: String,
  },
  invoiceNumberSchema: {
    type: String,
  },
  additionalTextForEndOfInvoices: {
    type: String,
  },
  additionalTextForReverseChargeInvoices: {
    type: String,
  },
  defaultRateType: {
    type: String,
  },
  defaultHourlyRate: {
    type: Number,
  },
  defaultDailyRate: {
    type: Number,
  },
  defaultTaxRate: {
    type: Number,
  },
});

// Create the model using the schema
const SettingsModel: Model<ISettings> = mongoose.model<ISettings>(
  "Settings",
  settingsSchema,
);

export default SettingsModel;
