// ESM
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

mongoose.connect(
  "mongodb+srv://admo_app_2022:doxOmE3CuxEcS3E1@cluster0.ebbqr.mongodb.net/?retryWrites=true&w=majority",
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const userModel = mongoose.model("User", userSchema);

async function createRandomUser() {
  return {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: await bcrypt.hash("test", 10),
    date: faker.date.recent(),
  };
}

for (let i = 0; i < 10; i++) {
  const contact = await createRandomUser();
  const res = await userModel.create(contact);
  console.log("res", res);
}
