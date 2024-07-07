import mongoose, { Schema } from "mongoose";

const invoiceDraftSchema = new mongoose.Schema({
  nr: {
    type: String,
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: false,
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
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  isReverseChargeInvoice: {
    type: Boolean,
  },
  storagePath: {
    type: String,
  },
});

const InvoiceDraftSchema = mongoose.model("InvoiceDraft", invoiceDraftSchema);

export default InvoiceDraftSchema;
