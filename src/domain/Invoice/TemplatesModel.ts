import mongoose from "mongoose";

const templatesModel = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  user: {
    type: String,
  },
  etag: {
    type: String,
  },
});

const TemplatesSchema = mongoose.model("Templates", templatesModel);

export default TemplatesSchema;
