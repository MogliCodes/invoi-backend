import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClient extends Document {
  company: string;
  street?: string;
  zip?: string;
  city?: string;
  taxId?: string;
  user: string;
}

const clientSchema: Schema<IClient> = new Schema({
  company: {
    type: String,
    required: true,
  },
  street: {
    type: String,
  },
  zip: {
    type: String,
  },
  city: {
    type: String,
  },
  taxId: {
    type: String,
  },
  user: {
    type: String,
    required: true,
  },
});

// Create the model using the schema
const ClientModel: Model<IClient> = mongoose.model<IClient>(
  "Client",
  clientSchema,
);

export default ClientModel;
