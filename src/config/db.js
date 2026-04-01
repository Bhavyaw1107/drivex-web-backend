import "../config/env.js"
import mongoose from "mongoose";


const MONGODB_URL = process.env.MONGODB_URL;

export const ConnectDB = async() => {
  try {
    console.log('Database connecting..')
    await mongoose.connect(MONGODB_URL);
    console.log('Database connected successfully!')
  } catch (error) {
    console.log(error);
     process.exit(1);
  }
}