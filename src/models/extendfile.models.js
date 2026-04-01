import mongoose from "mongoose";

const extendfile = new mongoose.Schema({
    
  fileId: String,
  userId: String,
  filename: String,
  version: Number,
  lastModified: Date,
  hash: String,
  deviceId: String

},{timestamps : true})


export const Extendfile = mongoose.model('Extendfile',extendfile);
