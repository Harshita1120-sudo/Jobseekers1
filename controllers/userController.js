import User from "../models/User.js";
import Job from "../models/job.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import generateToken from "../utils/generateToken.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import fs from "fs";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNo, city, country } = req.body;
    if (!name || !email || !password || !phoneNo|| !city || !country) {
      return res.status(400).json({
        result: false,
        message: "name,email,password,phoneNo,city,country are required",
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
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNo,
      city,
      country,
      role:"user"
    });
    if (user) {
      return res.status(201).json({
        result: true,
        message: "User registered successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        city: user.city,
        country: user.country,
        role:user.role,
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

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        result: false,
        message: "email and password are required",
      });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        result: false,
        message: "User not found",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        result: false,
        message: "Invalid password",
      });
    }
    const token = generateToken(res, user._id, user.role);
    return res.status(200).json({
      result: true,
      message: " User login successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        address: user.address,
        city: user.city,
        country: user.country,
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

export const getuserProfile = async (req, res) => {
  // let { userId } = req.params;
  // if (!userId) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "userId is required",
  //   });
  //}
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication token required (userId missing)",
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  console.log("FILES:", req.files);
  try {
    const { name, phoneNo, city, country, skills } = req.body;
    const user = await User.findById(req.user.id).select("-password");

    if (!user)
      return res.status(404).json({ result: false, message: "User not found" });

    if (name !== undefined) user.name = name;
    if (phoneNo !== undefined) user.phoneNo = phoneNo;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (skills !== undefined) user.skills = skills.split(",");

    
    if (req.files?.profileImage) {
      const result = await cloudinary.uploader.upload(
        req.files.profileImage[0].path,
        { folder: "profile_images" },
      );
      user.profileImage = result.secure_url;
      // fs.unlinkSync(filePath);
      fs.unlinkSync(req.files.profileImage[0].path);
    }

    if (req.files?.resume) {
      
      const result = await cloudinary.uploader.upload(
        req.files.resume[0].path,
        {
          folder: "resumes",
         resource_type: "raw",   
      //access_mode: "public",
        },
      );
       console.log("Cloudinary Result:", result); 
      user.resume = result.secure_url;
      //fs.unlinkSync(filePath);
      fs.unlinkSync(req.files.resume[0].path);
    }

    await user.save();
    res.status(200).json({
      result: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Update failed",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        result: false,
        message: "oldPassword and newPassword are required",
      });
    }
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        result: false,
        message: "User not found",
      });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        result: false,
        message: "oldPassword is incorrect",
      });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
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

export const deleteaccount = async (req, res) => {
  let userId  = req.user.id;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: false,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//searchandfilterjob,
export const searchAndFilterJob = async (req, res) => {
  try {
    const { keyword, location } = req.query;

    let query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const jobs = await Job.find(query)
      .select("title address jobType workMode")
      .populate("companyId", "companyName");

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

export const getAllJobs = async (req, res) => {
 try {

  const jobs = await Job.find().populate("companyId");

  if (jobs.length === 0) {
   return res.status(404).json({
    result: false,
    message: "No jobs found"
   });
  }

  return res.status(200).json({
   result: true,
   message: "Jobs fetched successfully",
   total: jobs.length,
   jobs
  });

 } catch (error) {
  return res.status(500).json({
   result: false,
   message: "Internal server error",
   error: error.message
  });
 }
};

// getjobdetails,
export const getJobDetails = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "companyId",
      "companyName email description website"
    );

    if (!job) {
      return res.status(404).json({
        result: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Job details fetched successfully",
      job,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// getmyapplication,
export const getMyApplication = async (req, res) => {
  try {
    const applications = await Application.find({
      userId: req.user.id,
    }).populate("jobId");

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
// ,aaply
export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({
        result: false,
        message: "jobId is required",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        result: false,
        message: "Resume file is required",
      });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        result: false,
        message: "Job not found",
      });
    }
    if (job.status === "closed") {
      return res.status(400).json({
        result: false,
        message: "This job is no longer accepting applications",
      });
    }
    const existingApplication = await Application.findOne({
      jobId,
      userId: req.user.id,
    });
    if (existingApplication) {
      return res.status(200).json({
        result: false,
        message: "You have already applied for this job",
      });
    }
    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw", 
      folder: "resumes",
    });

    fs.unlinkSync(req.file.path);

    const application = await Application.create({
      jobId,
      userId: req.user.id,
      resume: cloudResult.secure_url,
    });
    return res.status(201).json({
      result: true,
      message: "Job applied successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
//savejob,
export const saveJob = async (req, res) => {
  try {
    // console.log("USER:", req.user);
    // console.log("JOB ID:", req.params.jobId);
    const jobId = req.params.jobId;
    if (!jobId) {
      return res.status(400).json({
        result: false,
        message: "Job ID is required in params",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        result: false,
        message: "Job not found",
      });
    }

    const alreadySaved = await SavedJob.findOne({
      userId: req.user.id,
      jobId,
    });

    if (alreadySaved) {
      return res.status(200).json({
        result: false,
        message: "Job already saved",
      });
    }

    const savedJob = await SavedJob.create({
      userId: req.user.id,
      jobId,
    });

    return res.status(201).json({
      result: true,
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
//  getsaveJobs,
export const getSavedJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        result: false,
        message: "Unauthorized user. User ID not found in token",
      });
    }

    const savedJobs = await SavedJob.find({
      userId: req.user.id,
    }).populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "companyName logo email description website",
        },
      });

    if (!savedJobs || savedJobs.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No saved jobs found for this user",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Saved jobs fetched successfully",
      totalSavedJobs: savedJobs.length,
      savedJobs,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error while fetching saved jobs",
      error: error.message,
    });
  }
};
// removeSavedJob
export const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        result: false,
        message: "Job ID is required",
      });
    }

    const savedJob = await SavedJob.findOneAndDelete({
      userId: req.user.id,
      jobId,
    });

    if (!savedJob) {
      return res.status(404).json({
        result: false,
        message: "Saved job not found",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Saved job removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const getAppliedJobs = async (req, res) => {
  
  try {
    const userId = req.user.id;

    const applications = await Application.find({ userId })
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "companyName logo email description website",
        },
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({
      result: true,
      message: "Applied jobs fetched successfully",
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Error fetching applied jobs",
      error: error.message,
    });
  }
};

// withdrow application
export const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!application) {
      return res.status(404).json({
        result: false,
        message: "Application not found or you are not allowed to withdraw it",
      });
    }

    return res.status(200).json({
      result: true,
      message: "Your application has been withdrawn successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Failed to withdraw application",
      error: error.message,
    });
  }
};

/* User Logout */
// export const logoutUser = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({
//         result: "false",
//         message: "userId is required for logout.",
//       });
//     }
 
//     const user = await User.findById(userId);
 
//     if (!user) {
//       return res.status(404).json({
//         result: "false",
//         message: "User not found. Logout failed.",
//       });
//     }
 
//     // Optional: Clear FCM ID or session-related info
//     await User.findByIdAndUpdate(userId, { fcmId: null });
 
//     res.status(200).json({
//       result: "true",
//       message: "User logout successfully.",
//     });
//   } catch (err) {
//     console.error("Logout Error:", err);
//     res.status(500).json({
//       result: "false",
//       message: "Internal server error.",
//     });
//   }
// };
 
export const logoutUser = async (req, res) => {
  try {

    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { fcmId: null });

    res.status(200).json({
      result: true,
      message: "User logout successfully.",
    });

  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({
      result: false,
      message: "Internal server error.",
    });
  }
};
 
