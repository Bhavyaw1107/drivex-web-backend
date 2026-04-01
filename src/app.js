const express = require("express");
const app = express();

app.use(express.json());

const fileRoutes = require("./routes/fileRoutes");
app.use("/api/files", fileRoutes);

module.exports = app;