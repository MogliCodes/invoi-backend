// ESM
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

mongoose.connect(
  "mongodb+srv://admo_app_2022:doxOmE3CuxEcS3E1@cluster0.ebbqr.mongodb.net/?retryWrites=true&w=majority",
);

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
const contactModel = mongoose.model("Contact", contactSchema);

function createRandomContact(userId = "6582e13c5499efbb082feb4b") {
  return {
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    dob: faker.date.birthdate(),
    street: faker.location.streetAddress(),
    zip: faker.location.zipCode(),
    user: userId,
  };
}

export async function createDemoContacts() {
  for (let i = 0; i < 50; i++) {
    const contact = createRandomContact();
    const res = await contactModel.create(contact);
    console.log("res", res);
  }
}
