import mongoose from "mongoose";
import { consola } from "consola";

export const connectDB = async (dbUrl: string) => {
  try {
    await mongoose.connect(dbUrl);
    consola.success("Connected to the database");
  } catch (error: unknown) {
    consola.error(new Error(error as string));
  }
};
