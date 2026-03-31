import User from "../models/User.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import Otp from "../models/OTP.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/generateOTP.js";

export const forgotPassword = async (req, res) => {
  try {
    const { email, phoneNo } = req.body;

    if (!email && !phoneNo) {
      return res.status(400).json({
        result: false,
        message: "Email or PhoneNo is required",
      });
    }

    let query = {};

    if (email) {
      query = { email };
    } else {
      query = { phoneNo: Number(phoneNo) };
    }

    const [user, company, admin] = await Promise.all([
      User.findOne(query),
      Company.findOne(query),
      Admin.findOne(query),
    ]);


    let account, role;
    if (user) { account = user; role = "user"; }
    else if (company) { account = company; role = "company"; }
    else if (admin) { account = admin; role = "admin"; }

    if (!account) {
      return res.status(404).json({ result: false, message: "Account not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: account.email },
      { otp: otpCode, role: role },
      { upsert: true, new: true }
    );

    await sendEmail(account.email, otpCode);
    return res.status(200).json({
      result: true,
      message: "OTP sent successfully to your registered email. We identified you as: " + role,
    });

  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Server Error",
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ result: false, message: "email,otp,newPassword,all fields are required" });
    }

    const otpData = await Otp.findOne({ email, otp });

    if (!otpData) {
      return res.status(400).json({ result: false, message: "Invalid or expired OTP" });
    }

    let Model;
    if (otpData.role === "user") Model = User;
    else if (otpData.role === "company") Model = Company;
    else if (otpData.role === "admin") Model = Admin;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await Model.findOneAndUpdate({ email: email }, { password: hashedPassword });

    await Otp.deleteOne({ _id: otpData._id });

    return res.status(200).json({
      result: true,
      message: `Password reset successfully for ${otpData.role}`,
    });

  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Reset Failed",
      error: error.message
    });
  }
};

