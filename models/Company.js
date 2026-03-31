import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, " Company name is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Official email is required"],
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
    website: String,
    phoneNo: {
      type: String,
      required: [true, "Phone number is required"],
    },
    location: {
      type: String,
      required: [true, "Company location is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    logo: {
      type: String,
      default: "",
    },
    description: {
      type:String,
      default:""
    },
    role: {
      type: String,
      default: "company",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);
const Company = mongoose.model("Company", companySchema);
export default Company;
