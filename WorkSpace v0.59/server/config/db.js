const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Database');
  } catch (err) {
    console.error('Database connection error:', err);
  }
};

module.exports = connectDB;
