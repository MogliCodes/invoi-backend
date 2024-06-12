import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  user: {
    type: String,
  },
});

const ServiceSchema = mongoose.model("Service", serviceSchema);

export default ServiceSchema;
