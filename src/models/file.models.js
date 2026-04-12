const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  s3Key: { type: String },

  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },

  owner: {
    type: String, // clerkId
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "synced"],
    default: "pending"
  },

  hash: String,
  version: { type: Number, default: 1 },

  isStarred: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);
