import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
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
  street: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
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
    required: true,
  },
  iban: {
    type: String,
    required: true,
  },
  bic: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  invoiceNumberSchema: {
    type: String,
    required: false,
  },
  additionalTextForEndOfInvoices: {
    type: String,
    required: false,
  },
  additionalTextForReverseChargeInvoices: {
    type: String,
    required: false,
  },
  defaultRateType: {
    type: String,
    required: false,
  },
  defaultHourlyRate: {
    type: Number,
    required: false,
  },
  defaultDailyRate: {
    type: Number,
    required: false,
  },
  defaultTaxRate: {
    type: Number,
    required: false,
  },
});

const SettingsSchema = mongoose.model("Settings", settingsSchema);
export default SettingsSchema;
