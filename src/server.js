import express from "express";
import { ConnectDB } from "./config/db.js";
import "./config/env.js"
import checkRouter from "./routes/health.router.js"
import fileRoutes from "./routes/fileRoutes.js"

const app = express();

app.use(express.json());

app.use("/check",checkRouter);
app.use("/api/files", fileRoutes);

app.get("/", (req, res) => {
  res.send("DriveX Backend Running...");
});


ConnectDB().then(() => {
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
});
