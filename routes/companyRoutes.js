import express from "express";
import { changePassword, companyDeleteAccount, createJob, deleteAllJobs, deleteJob, getAllApplicants, getApplicants, getCompanyJobs, getcompanyProfile, getJobById, getJobDetails, jobStats, loginCompany, logoutCompany, registerCompany, updateApplicationStatus, updatecompanyProfile, updateJob } from "../controllers/companyController.js";
import { authCompanyMiddleware } from "../middlewares/authCompanyMiddleware.js";
import upload from "../middlewares/upload.js";

const CRoutes=express.Router();

CRoutes.post("/registerCompany",registerCompany);
CRoutes.post("/loginCompany",loginCompany);
CRoutes.get("/getcompanyProfile",authCompanyMiddleware,getcompanyProfile);
CRoutes.put("/updatecompanyProfile",authCompanyMiddleware,
  upload.fields([{ name: "logo", maxCount: 1 }]),updatecompanyProfile);
CRoutes.post("/changePassword",authCompanyMiddleware,changePassword);
CRoutes.delete("/companyDeleteAccount",authCompanyMiddleware,companyDeleteAccount);

CRoutes.post("/createJob",authCompanyMiddleware,createJob);
CRoutes.get("/getJobById/:jobId",authCompanyMiddleware,getJobById);
CRoutes.get("/getCompanyJobs",authCompanyMiddleware,getCompanyJobs);
CRoutes.get("/getJobDetails/:jobId",authCompanyMiddleware,getJobDetails);
CRoutes.put("/updateJob/:id",authCompanyMiddleware,updateJob);
CRoutes.delete("/deleteJob/:id",authCompanyMiddleware,deleteJob);
CRoutes.delete("/deleteAllJobs",authCompanyMiddleware,deleteAllJobs);

CRoutes.get("/getapplicants/:jobId",authCompanyMiddleware,getApplicants);
CRoutes.get("/getAllApplicants",authCompanyMiddleware,getAllApplicants);
CRoutes.put("/updateapplicationstatus/:applicationId",authCompanyMiddleware,updateApplicationStatus);
CRoutes.get("/jobStats",authCompanyMiddleware,jobStats);
CRoutes.post("/logoutCompany",authCompanyMiddleware,logoutCompany);



export default CRoutes;