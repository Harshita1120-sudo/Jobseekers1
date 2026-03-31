import express from "express";
import { applyJob, changePassword, deleteaccount, getAllJobs, getAppliedJobs, getJobDetails, getMyApplication, getSavedJobs, getuserProfile, loginUser, logoutUser, registerUser, removeSavedJob, saveJob, searchAndFilterJob, updateProfile, withdrawApplication } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authUserMiddleware.js";
import upload from "../middlewares/upload.js";



const uRoutes=express.Router();


uRoutes.post("/registerUser",registerUser)
uRoutes.post("/loginUser",loginUser)
uRoutes.get("/getuserProfile",authMiddleware,getuserProfile)
uRoutes.put("/updateProfile",authMiddleware,upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 } ]),updateProfile);
uRoutes.post("/changePassword",authMiddleware,changePassword);
uRoutes.delete("/deleteaccount",authMiddleware,deleteaccount);

uRoutes.get("/searchandfilterjob",authMiddleware, searchAndFilterJob);
uRoutes.get("/getAllJobs",authMiddleware, getAllJobs);
uRoutes.get("/getjobdetails/:id",authMiddleware,getJobDetails);
uRoutes.get("/getmyapplication",authMiddleware,getMyApplication);
uRoutes.post("/applyJob",authMiddleware,upload.single("resume"),applyJob);
uRoutes.post("/saveJob/:jobId",authMiddleware,saveJob);
uRoutes.delete("/withdrawApplication/:id",authMiddleware,withdrawApplication);
uRoutes.get("/getSavedJobs",authMiddleware,getSavedJobs);
uRoutes.get("/getAppliedJobs",authMiddleware,getAppliedJobs);
uRoutes.delete("/removeSavedJob/:jobId",authMiddleware,removeSavedJob);
uRoutes.post("/logoutUser",authMiddleware,logoutUser);

export default uRoutes;
