
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, " Fullname is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select:false
    },
    phoneNo: {
      type: Number,
      required: [true, "Phone number is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum:["user","admin","company"],
      default: "user",
    },
    resume: {
      type: String,
      default: "",
    },
    skills: [String],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);
export default User;
