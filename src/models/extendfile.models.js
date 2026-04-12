const mongoose = require("mongoose");

const extendfileSchema = new mongoose.Schema({
  fileId: String,
  userId: String, // should be clerkId
  filename: String,
  version: Number,
  lastModified: Date,
  hash: String,
  deviceId: String
}, { timestamps: true });

module.exports = mongoose.model("Extendfile", extendfileSchema);