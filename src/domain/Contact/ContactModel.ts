import mongoose, { Schema } from "mongoose";

const contactSchema = new mongoose.Schema({
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
    required: false,
  },
  dob: {
    type: Date,
    required: false,
  },
  street: {
    type: String,
    required: false,
  },
  zip: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  user: {
    type: String,
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
});

const ContactSchema = mongoose.model("Contact", contactSchema);

export default ContactSchema;
