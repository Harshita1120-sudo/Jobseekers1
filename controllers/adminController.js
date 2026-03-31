import User from "../models/User.js";
import Job from "../models/job.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import generateToken from "../utils/generateToken.js";
import Application from "../models/Application.js";
import fs from "fs";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phoneNo } = req.body;
    if (!name || !email || !password || !phoneNo) {
      return res.status(400).json({
        result: false,
        message: "name,email,password,phoneNo are required",
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        result: false,
        message: "Please provide a valid email address",
      });
    }

    const [userExist, companyExist, adminExist] = await Promise.all([
      User.findOne({ email }),
      Company.findOne({ email }),
      Admin.findOne({ email }),
    ]);

    if (userExist || companyExist || adminExist) {
      return res.status(400).json({
        result: false,
        message:
          "This email is already registered. Please use a different email or login.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      phoneNo,
      role: "admin",
    });
    if (admin) {
      return res.status(201).json({
        result: true,
        message: "Admin registered successfully",
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNo: admin.phoneNo,
        role: admin.role,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        result: false,
        message: "email and password are required",
      });
    }
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(404).json({
        result: false,
        message: "Admin not found",
      });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        result: false,
        message: "Invalid password",
      });
    }
    const token = generateToken(res, admin._id, admin.role);
    return res.status(200).json({
      result: true,
      message: " Admin login successfully",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNo: admin.phoneNo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;

    if (!adminId) {
      return res.status(400).json({
        result: false,
        message: "Admin id not found in token",
      });
    }

    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({
        result: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Admin profile fetched successfully",
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  console.log("FILES:", req.files);
  try {
    const { name, phoneNo } = req.body;
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin)
      return res.status(404).json({ result: false, message: "User not found" });

    if (name !== undefined) admin.name = name;
    if (phoneNo !== undefined) admin.phoneNo = phoneNo;
  

    if (req.files?.profileImage) {
      const filePath = req.files.profileImage[0].path;
      const result = await cloudinary.uploader.upload(
        filePath,{ folder: "profile_images" },
      );
      admin.profileImage = result.secure_url;
      fs.unlinkSync(filePath);
    }

    await admin.save();
    res.status(200).json({
      result: true,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Update failed",
      error: error.message,
    });
  }
};
export const changeAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        result: false,
        message: "oldPassword and newPassword are required",
      });
    }
    const admin = await Admin.findById(req.admin.id).select("+password");
    if (!admin) {
      return res.status(404).json({
        result: false,
        message: "admin not found",
      });
    }
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        result: false,
        message: "oldPassword is incorrect",
      });
    }
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    return res.status(200).json({
      result: true,
      message: "Password changed successfully,Please login again.",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error during password change",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const user = await User.find().select("-password");
    if (user.length === 0) {
      return res.status(404).json({
        result: false,
        message: " No user found",
      });
    }
    return res.status(200).json({
      result: true,
      message: "Users fetched successfully",
      total: user.length,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const company = await Company.find().select("-password");
    if (company.length === 0) {
      return res.status(404).json({
        result: false,
        message: " No companies found",
      });
    }
    return res.status(200).json({
      result: true,
      message: "Companies fetched successfully",
      total: company.length,
      company,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const getJobsByCompanyAdmin = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        result: false,
        message: "companyId is required in params",
      });
    }

    // check company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        result: false,
        message: "Company not found",
      });
    }

    const jobs = await Job.find({ companyId });

    return res.status(200).json({
      result: true,
      message: "Company jobs fetched successfully",
      total: jobs.length,
      companyName: company.name,
      jobs,
    });

  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("companyId");

    if (jobs.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No jobs found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Jobs fetched successfully",
      total: jobs.length,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("userId");

    if (applications.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No applications found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Applications fetched successfully",
      total: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteUserbyadmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        result: false,
        message: "userId is required in params",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteCompanybyadmin = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        result: false,
        message: "companyId is required in params",
      });
    }

    const company = await Company.findByIdAndDelete(companyId);

    if (!company) {
      return res.status(404).json({
        result: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteJobbyadmin = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        result: false,
        message: "jobId is required in params",
      });
    }

    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      return res.status(404).json({
        result: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const adminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    return res.status(200).json({
      result: true,
      message: "Dashboard stats fetched successfully",
      stats: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// export const logoutAdmin = async (req, res) => {
//   try {
//     const { adminId } = req.body;
//     if (!adminId) {
//       return res.status(400).json({
//         result: "false",
//         message: "adminId is required for logout.",
//       });
//     }

//     const admin = await Admin.findById(adminId);

//     if (!admin) {
//       return res.status(404).json({
//         result: "false",
//         message: "Admin not found. Logout failed.",
//       });
//     }

//     // Optional: Clear FCM ID or session-related info
//     await Admin.findByIdAndUpdate(adminId, { fcmId: null });

//     res.status(200).json({
//       result: "true",
//       message: "Admin logout successful.",
//     });
//   } catch (err) {
//     console.error("Logout Error:", err);
//     res.status(500).json({
//       result: "false",
//       message: "Internal server error.",
//     });
//   }
// };

export const logoutAdmin = async (req, res) => {
  try {
    
    const adminId = req.admin.id;

    await Admin.findByIdAndUpdate(adminId, { fcmId: null });

    res.status(200).json({
      result: true,
      message: "Admin logout successfully.",
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({
      result: false,
      message: "Internal server error.",
    });
  }
};
