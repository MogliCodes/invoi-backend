import mongoose from "mongoose";

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
