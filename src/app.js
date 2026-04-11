const express = require("express");
const app = express();

app.use(express.json());

const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
const authRoutes = require("./routes/auth");

app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
