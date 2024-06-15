import mongoose, { Schema, Document } from "mongoose";

// Define the interface for TypeScript
export interface ITimeRecord extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for Mongoose
const timeRecordSchema = new Schema<ITimeRecord>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  description: { type: String, required: false },
});

// Create the model
const TimeRecord = mongoose.model<ITimeRecord>("TimeRecord", timeRecordSchema);

export default TimeRecord;
