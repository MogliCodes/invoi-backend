import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import ContactSchema from "../Contact/ContactModel.js";

mongoose.connect(
  "mongodb+srv://admo_app_2022:doxOmE3CuxEcS3E1@cluster0.ebbqr.mongodb.net/?retryWrites=true&w=majority",
);

const clientSchema = new mongoose.Schema({
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
});
const ClientSchema = mongoose.model("Client", clientSchema);

export default ClientSchema;
