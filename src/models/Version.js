const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String // clerkId
  }
});

module.exports = mongoose.model("Version", versionSchema);