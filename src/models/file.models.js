import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: String,
  url: String,
  status: {
    type: String,
    enum: ["pending", "synced"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("File", fileSchema);