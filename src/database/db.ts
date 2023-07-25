import mongoose, { Connection, Mongoose } from "mongoose";
import { config } from "dotenv";
config({ path: "../.env" });

class DatabaseConnection {
  private readonly uri: string;
  private mongooseInstance: Mongoose | null;
  private connection: Connection | null;

  constructor() {
    this.uri = process.env.DATABASE_URL || "";
    this.mongooseInstance = null;
    this.connection = null;
  }

  async connect(): Promise<void> {
    try {
      this.mongooseInstance = await mongoose.connect(this.uri);

      this.connection = mongoose.connection;
      console.log("Connected to the database");
    } catch (error) {
      console.error("Failed to connect to the database", error);
      throw error;
    }
  }
}

export default DatabaseConnection;
