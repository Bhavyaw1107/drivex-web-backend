import express from "express";
import { ConnectDB } from "./config/db.js";
import "./config/env.js"
import app from "./app.js";

const PORT = process.env.PORT || 3000;

ConnectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
