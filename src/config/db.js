const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Database connecting..");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected:", mongoose.connection.host);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;