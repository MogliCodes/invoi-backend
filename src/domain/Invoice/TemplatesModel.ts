import mongoose, { Model, Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  title: string;
  name: string;
  tags: string;
  fileName: string;
  user?: string;
  etag?: string;
}

const templatesModel: Schema<ITemplate> = new mongoose.Schema({
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
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  etag: {
    type: String,
  },
});

const TemplatesSchema: Model<ITemplate> = mongoose.model<ITemplate>(
  "Templates",
  templatesModel,
);

export default TemplatesSchema;
