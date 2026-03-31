import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "company", "admin"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  }, 
});

export default mongoose.model("Otp", otpSchema);
