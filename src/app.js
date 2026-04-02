const express = require("express");
const app = express();

app.use(express.json());

const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");

app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);

module.exports = app;
