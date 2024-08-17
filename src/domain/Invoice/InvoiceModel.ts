import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvoice extends Document {
  nr: string;
  client: string;
  contact?: Schema.Types.ObjectId;
  title: string;
  date?: Date;
  performancePeriodStart?: Date;
  performancePeriodEnd?: Date;
  status?: string;
  items?: string;
  total?: string;
  taxes?: string;
  totalWithTaxes?: string;
  file?: string;
  user?: string;
  isReverseChargeInvoice?: boolean;
  storagePath?: string;
}

const invoiceSchema: Schema<IInvoice> = new Schema({
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

const InvoiceSchema: Model<IInvoice> = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema,
);

export default InvoiceSchema;
