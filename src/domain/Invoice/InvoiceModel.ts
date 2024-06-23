import mongoose, { Schema } from "mongoose";

const invoiceSchema = new mongoose.Schema({
  nr: {
    type: String,
    required: true,
  },
  client: {
    type: String,
    required: true,
  },
  contact: {
    type: Schema.Types.ObjectId,
    ref: "Contact",
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
  },
  performancePeriodStart: {
    type: Date,
  },
  performancePeriodEnd: {
    type: Date,
  },
  status: {
    type: String,
  },
  items: {
    type: String,
  },
  total: {
    type: String,
  },
  taxes: {
    type: String,
  },
  totalWithTaxes: {
    type: String,
  },
  file: {
    type: String,
  },
  user: {
    type: String,
  },
  isReverseChargeInvoice: {
    type: Boolean,
  },
  storagePath: {
    type: String,
  },
});

const InvoiceSchema = mongoose.model("Invoice", invoiceSchema);

export default InvoiceSchema;
