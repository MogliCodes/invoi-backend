import express, { Application } from "express";

import appRoutes from "./app/routes/appRoutes.ts";

const app: Application = express();
const port: number = 8000;

app.use("/app", appRoutes);

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
