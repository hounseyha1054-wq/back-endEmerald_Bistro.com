import mongoose from "mongoose";

const mongodb = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL is not defined");
    }

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully!");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    await mongoose.connect(`${process.env.MONGODB_URL}/menu`);
  } catch (error) {
    console.error("Failed to connect MongoDB:", error.message);
    process.exit(1);  
  }
};

export default mongodb;