import express from "express";
import { adminDashboardStats, changeAdminPassword, deleteCompanybyadmin, deleteJobbyadmin, deleteUserbyadmin, getAdminProfile, getAllApplications, getAllCompanies, getAllJobs, getAllUsers, getJobsByCompanyAdmin, loginAdmin, logoutAdmin, registerAdmin, updateAdminProfile } from "../controllers/adminController.js";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js";
import upload from "../middlewares/upload.js";
import multer from "multer";


const aRoutes=express.Router();

aRoutes.post("/registerAdmin",registerAdmin)
aRoutes.post("/loginAdmin",loginAdmin)
aRoutes.get("/getAdminProfile",authAdminMiddleware,getAdminProfile)
aRoutes.put("/updateAdminProfile",authAdminMiddleware,upload.fields([
    { name: "profileImage", maxCount: 1 } ]),updateAdminProfile)
aRoutes.post("/changeAdminPassword",authAdminMiddleware,changeAdminPassword)
aRoutes.get("/getAllUsers",authAdminMiddleware, getAllUsers);
aRoutes.get("/getAllCompanies",authAdminMiddleware, getAllCompanies);
aRoutes.get("/getJobsByCompanyAdmin/:companyId",authAdminMiddleware, getJobsByCompanyAdmin);
aRoutes.get("/getAllJobs",authAdminMiddleware, getAllJobs);
aRoutes.get("/getAllApplications",authAdminMiddleware, getAllApplications);
aRoutes.delete("/deleteUserbyadmin/:userId",authAdminMiddleware, deleteUserbyadmin);
aRoutes.delete("/deleteCompanybyadmin/:companyId",authAdminMiddleware, deleteCompanybyadmin);
aRoutes.delete("/deleteJobbyadmin/:jobId",authAdminMiddleware, deleteJobbyadmin);
aRoutes.get("/adminDashboardStats",authAdminMiddleware, adminDashboardStats);
aRoutes.post("/logoutAdmin",authAdminMiddleware, logoutAdmin);

export default aRoutes;
