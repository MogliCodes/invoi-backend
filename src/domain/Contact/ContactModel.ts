import mongoose, { Document, Model, Schema } from "mongoose";

// Define an interface representing a Contact document in MongoDB
export interface IContact extends Document {
  firstname: string;
  lastname: string;
  email?: string;
  dob?: Date;
  street?: string;
  zip?: string;
  city?: string;
  avatar?: string;
  category?: string;
  user: string;
  client?: mongoose.Types.ObjectId;
}

// Define a schema for the Contact model
const contactSchema: Schema<IContact> = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  dob: {
    type: Date,
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
  avatar: {
    type: String,
  },
  category: {
    type: String,
  },
  user: {
    type: String,
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: false,
  },
});

// Create the model using the schema
const ContactModel: Model<IContact> = mongoose.model<IContact>(
  "Contact",
  contactSchema,
);

export default ContactModel;
