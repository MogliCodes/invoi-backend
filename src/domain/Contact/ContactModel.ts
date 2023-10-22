import mongoose from "mongoose";

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
  },
  dob: {
    type: Date,
  },
  street: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
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
});

module.exports = mongoose.model("Contact", contactSchema);
