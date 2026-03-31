import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs"
import generateToken from "../utils/generateToken.js";
import Job from "../models/job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const registerCompany = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      phoneNo,
      location,
      city,
      country,
    } = req.body;
    if (
      !companyName ||
      !email ||
      !password ||
      !phoneNo ||
      !location ||
      !city||
      !country
    ) {
      return res.status(400).json({
        result: false,
        message:
          "All fields are required companyName,email,password,phoneNo,location,city,country.",
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
          Admin.findOne({ email })
        ]);
    
        if (userExist || companyExist || adminExist) {
          return res.status(400).json({
            result: false,
            message: "This email is already registered. Please use a different email or login.",
          });
        }
    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
      companyName,
      email,
      password: hashedPassword,
      phoneNo,
      location,
      city,
      country,
      role:"company"
    });
    if (company) {
      return res.status(200).json({
        result: true,
        message: "Company registered successfully",
        _id: company._id,
        email:company.email,
        phoneNo:company.phoneNo,
        location:company.location,
        city:company.city,
        country:company.country,
        role:company.role,
      });
    } else {
        return res.status(400).json({
        success: false,
        message: "Invalid company data",
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

export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        result: false,
        message: "email and password are required for login ",
      });
    }
    const company = await Company.findOne({ email }).select("+password");
    if (!company) {
      return res.status(404).json({
        result: false,
        message: "Company not found",
      });
    }
    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).json({
        result: false,
        message: "Invalid Password",
      });
    }
    const token = generateToken(res, company._id, company.role);
    return res.status(200).json({
      result: true,
      message: "Company Login Successfully",
      token,
      company: {
        _id:company._id,
        companyName:company.companyName,
        email:company.email,
        phoneNo:company.phoneNo,
        location:company.location,
        city:company.city,
        country:company.country,
        description:company.description
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

export const getcompanyProfile = async (req, res) => {
  try {
     if (!req.company || !req.company.id) {
      return res.status(401).json({
        result: false,
        message: "Valid authentication token required (comapnyId missing)",
      });
    }

    const companyId = req.company.id;
    const company = await Company.findById(companyId).select("-password");
    if (!company) {
      return res.status(404).json({
        result: false,
        message: "Company profile not found",
      });
    }
    return res.status(200).json({
      result: true,
      company,
      message: "Company profile fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result: true,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updatecompanyProfile = async (req, res) => {
  try {
    const {  companyName,email, phoneNo,location,city,country,website,description } = req.body;
    const company = await Company.findById(req.company.id).select("-password");

    if (!company) return res.status(404).json({ result: false, message: "Company not found" });

      if (companyName !== undefined) company.companyName = companyName;
      if (email !== undefined) company.email = email;
    if (phoneNo !== undefined) company.phoneNo = phoneNo;
    if (location !== undefined) company.location = location;
    if (city !== undefined) company.city = city;
    if (country !== undefined) company.country = country;
    if (description !== undefined) company.description = description;
    
    if (website !== undefined) {
  const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/;

  if (!urlPattern.test(website)) {
    return res.status(400).json({
      result: false,
      message: "Invalid website URL format",
    });
  }
  let formattedUrl = website;
  if (!website.startsWith("http://") && !website.startsWith("https://")) {
    formattedUrl = "https://" + website;
  }

  company.website = formattedUrl;
}

    // ✅ Profile Image Upload
    if (req.files?.logo) {
      const result = await cloudinary.uploader.upload(
        req.files.logo[0].path,
        { folder: "logo_images" }
      );
      company.logo = result.secure_url;
      fs.unlinkSync(req.files.logo[0].path);
    }

    await company.save();
    res.status(200).json({ 
        result: true,
         message: "Company Profile updated successfully", 
         data: company });
  } catch (error) {
    res.status(500).json({
         result: false,
          message: "Update failed",
           error: error.message
         });
  }
};

export const changePassword=async(req,res)=>{
  try {
    const {oldPassword,newPassword}=req.body;
    if(!oldPassword || !newPassword){
      return res.status(400).json({
        result:false,
        message:"oldPassword and newPassword are required",
      });
    }
    
    const company=await Company.findById(req.company.id).select("+password");
    if(!company){
      return res.status(404).json({
        result:false,
        message:"company not found"
      });
    }
    const isMatch=await bcrypt.compare(oldPassword,company.password);
    if(!isMatch){
      return res.status(401).json({
        result:false,
        message:"oldPassword is incorrect",
      });
    }
    const salt=await bcrypt.genSalt(10);
    company.password=await bcrypt.hash(newPassword,salt);
    await company.save();
    return res.status(200).json({
      result:true,
      message:"Password changed successfully,Please login again.",
    });
  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error during password change",
      error:error.message,
    });
  }
};

export const companyDeleteAccount = async (req, res) => {
  let  companyId  = req.company.id;
  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "companyId is not found from token",
    });
  }

  try {
    const company = await Company.findByIdAndDelete(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "company not found",
      });
    }

    res.status(200).json({
      success: false,
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// createjob,
export const createJob=async(req,res)=>{
  try {
    const{title,description,address,category,jobType,vacancy,salary,experience,workMode}=req.body;
    if(!title){
      return res.status(400).json({
       result:false,
       message:"All fields are required title,description,category,jobtype,vacancy,salary,experience,workMode,address "
      })
    }
     const existingJob = await Job.findOne({
      title: title,
      companyId: req.company.id,
    });

    if (existingJob) {
      return res.status(409).json({
        result: false,
        message: "This job already exists for your company",
      });
    }
    const job = await Job.create({
      title,
      description,
      companyId: req.company.id,
      category,
      jobType,
      vacancy,
      salary,
      workMode,
      experience,
      address,
    });

    res.status(201).json({
      result: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    })
  }
}

// getjobbyid,
export const getJobById=async(req,res)=>{
  try {
  
    const job = await Job.findById(req.params.jobId).populate("companyId", "companyName logo");
    if (!job){
       return res.status(404).json({ 
        result: false,
         message: "Job not found",
        });
    }
    return res.status(200).json({
      result:true,
      message:"getJob fetched successfully",
      job,
    })
  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    })
  }
}

// getcompanyjob,
export const getCompanyJobs=async(req,res)=>{
  try {
    const companyId=req.company.id;
    if(!companyId){
      return res.status(401).json({
        result:false,
        message:"Unauthorized. Company not found in token",
      });
    }
    const jobs=await Job.find({companyId}).populate("companyId","companyName email");
    if(!jobs || jobs.length===0){
      return res.status(404).json({
        result:false,
        message:"No jobs found for this company",
        total:0,
        jobs:[],
      });
    }
    return res.status(200).json({
      result:true,
      message:"Company jobs fetched successfully",
      total:jobs.length,
      jobs,
    })
    
  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    })
  }
}

export const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        result: false,
        message: "jobId is required",
      });
    }

    const job = await Job.findById(jobId).populate(
      "companyId",
      "companyName email logo"
    );

    if (!job) {
      return res.status(404).json({
        result: false,
        message: "Job not found",
      });
    }

    // ✅ security check (VERY IMPORTANT)
    if (String(job.companyId._id) !== String(req.company.id)) {
      return res.status(403).json({
        result: false,
        message: "You are not authorized to view this job",
      });
    }

    const applicantsCount = await Application.countDocuments({
      jobId,
    });

    return res.status(200).json({
      result: true,
      message: "Job details fetched successfully",
      job,
      applicantsCount, 
    });

  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateJob=async(req,res)=>{

  try {
    if (!req.company) {
      return res.status(403).json({
        result: false,
        message: "Only company can update jobs",
      });
    }
    const job=await Job.findById(req.params.id);
    if(!job){
      return res.status(404).json({
        result:false,
        message:"Job not found",
      });
    }
    if(String(job.companyId)!==String(req.company.id)){
      return res.status(403).json({
        result:false,
        message:"You are not authorized to update this job",
      });
    }
    const updatedJob=await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );
    return res.status(200).json({
      result:true,
      message:"Job updated successfully",
      job:updatedJob,
    });

  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    });
  }
}

export const deleteJob=async(req,res)=>{
  try {
    const job=await Job.findById(req.params.id);
    if(!job){
      return res.status(404).json({
        result:false,
        message:"Job not found",
      });
    }
    if(String (job.companyId)!==String(req.company.id)){
      return res.status(403).json({
        result:false,
        message:"You are not authorized to delete this job",
      });
    }
    await Job.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      result:true,
      message:"Job deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    });
  }
}

export const deleteAllJobs=async(req,res)=>{
  try {
    if(!req.comapny){
      return res.status(403).json({
        result:false,
        message:"Unauthorized token"
      });
    }
    const jobs=await Job.find({companyId:req.company.id});
    if(jobs.length===0){
      return res.status(404).json({
        result:false,
        message:"Jobs not found",
      });
    }
    const deletedJobs=await Job.deleteMany({
      companyId:req.company.id
    });
    return res.status(200).json({
      result:true,
      message:"All jobs deleted successfully",
      totalDeleted:deletedJobs.deletedCount
    });

  } catch (error) {
    return res.status(500).json({
      result:false,
      message:"Internal server error",
      error:error.message,
    });
  }
}

export const getApplicants = async (req,res)=>{
 try{

  const job = await Job.findById(req.params.jobId);

  if(!job){
   return res.status(404).json({
    result:false,
    message:"Job not found"
   });
  }

  if(String(job.companyId) !== String(req.company.id)){
   return res.status(403).json({
    result:false,
    message:"You are not authorized to view applicants"
   });
  }

  const applicants = await Application.find({
   jobId:req.params.jobId
  }).populate("userId","name email phoneNo skills");

  if(applicants.length === 0){
   return res.status(404).json({
    result:false,
    message:"No applicants found"
   });
  }

  return res.status(200).json({
   result:true,
   message:"Applicants fetched successfully",
   total:applicants.length,
   applicants
  });

 }catch(error){
  return res.status(500).json({
   result:false,
   message:"Internal server error",
   error:error.message
  });
 }
}

export const getAllApplicants = async (req, res) => {
  try {
    const companyId = req.company.id;

    const jobs = await Job.find({ companyId }).select("_id");

    const jobIds = jobs.map(job => job._id);

    const applicants = await Application.find({
      jobId: { $in: jobIds }
    })
    .populate("userId", "name email phoneNo skills")
    .populate("jobId", "title");

    if (applicants.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No applicants found"
      });
    }

    return res.status(200).json({
      result: true,
      message: "All applicants fetched successfully",
      total: applicants.length,
      applicants
    });

  } catch (error) {
    return res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const updateApplicationStatus = async (req,res)=>{
 try{
  const{applicationId}=req.params;
  const {status} = req.body;
  
  if (!applicationId) {
   return res.status(400).json({
    result: false,
    message: "applicationId is required ,using params"
   });
  }

  if(!status){
   return res.status(400).json({
    result:false,
    message:"status is required"
   });
  }
  const validStatus = ["applied","reviewed","shortlisted","rejected"];

  if (!validStatus.includes(status)) {
   return res.status(400).json({
    result:false,
    message:"Invalid status value"
   });
  }

  const application = await Application.findById(applicationId);

  if(!application){
   return res.status(404).json({
    result:false,
    message:"Application not found"
   });
  }

  const job = await Job.findById(application.jobId);

  if (!job || String(job.companyId) !== String(req.company.id)) {
   return res.status(403).json({
    result:false,
    message:"You are not authorized to update this application"
   });
  }

  application.status = status;
  await application.save();

  return res.status(200).json({
   result:true,
   message:"Application status updated successfully",
   application
  });

 }catch(error){
  return res.status(500).json({
   result:false,
   message:"Internal server error",
   error:error.message
  });
 }
}

export const jobStats = async (req,res)=>{
 try{

  if(!req.company || !req.company.id){
   return res.status(401).json({
    result:false,
    message:"Unauthorized company. Company ID not found in token"
   });
  }

  const companyId = req.company.id;

  const totalJobs = await Job.countDocuments({ companyId });


  const openJobs = await Job.countDocuments({
   companyId,
   status:"open"
  });

  const closedJobs = await Job.countDocuments({
   companyId,
   status:"closed"
  });

  const jobs = await Job.find({ companyId }).select("_id");

  const jobIds = jobs.map(job => job._id);

  const totalApplicants = await Application.countDocuments({
   jobId: { $in: jobIds }
  });

  return res.status(200).json({
   result:true,
   message:"Job statistics fetched successfully",
   stats:{
    totalJobs,
    openJobs,
    closedJobs,
    totalApplicants
   }
  });

 }catch(error){
  return res.status(500).json({
   result:false,
   message:"Internal server error while fetching job statistics",
   error:error.message
  });
 }
}



export const logoutCompany = async (req, res) => {
  try {

    const companyId = req.company.id;

    await Company.findByIdAndUpdate(companyId, { fcmId: null });

    res.status(200).json({
      result: true,
      message: "Company logout successfully.",
    });

  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({
      result: false,
      message: "Internal server error.",
    });
  }
};
