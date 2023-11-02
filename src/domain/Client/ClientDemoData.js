// ESM
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

mongoose.connect(
  "mongodb+srv://admo_app_2022:doxOmE3CuxEcS3E1@cluster0.ebbqr.mongodb.net/?retryWrites=true&w=majority",
);

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
  user: {
    type: String,
  },
});
const clientModel = mongoose.model("Client", clientSchema);

function createRandomClient() {
  return {
    company: faker.company.name(),
    street: faker.location.streetAddress(),
    zip: faker.location.zipCode(),
    city: faker.location.city(),
    taxId: faker.finance.iban(),
    user: "6528f805a3b18735c132f163",
  };
}

for (let i = 0; i < 50; i++) {
  const client = createRandomClient();
  const res = await clientModel.create(client);
  console.log("res", res);
}
