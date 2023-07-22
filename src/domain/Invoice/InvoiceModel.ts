import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  nr: {
    type: String,
    required: true,
  },
  client: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
  },
  dateRangeStart: {
    type: Date,
  },
  dateRangeEnd: {
    type: Date,
  },
  status: {
    type: String,
  },
  items: {
    type: String,
  },
  billingTotal: {
    type: String,
  },
  billingTaxes: {
    type: String,
  },
  billingTotalWithTaxes: {
    type: String,
  },
  file: {
    type: String,
  },
  user: {
    type: String,
  },
});

const InvoiceSchema = mongoose.model("Invoice", invoiceSchema);

export default InvoiceSchema;
