import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, " Admin name is required"],
    },
    email: {
      type: String,
      required: [true, " Admin Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, " Admin Password is required"],
      select: false,
    },
    phoneNo: {
      type: String,
      required: [true, " Admin Phone number is required"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "admin",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);
const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
