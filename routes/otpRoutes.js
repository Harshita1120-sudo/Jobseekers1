import express from "express";
import { forgotPassword, resetPassword } from "../controllers/otpController.js";
const ORoutes = express.Router();

ORoutes.post("/forgotPassword", forgotPassword);
ORoutes.post("/resetPassword", resetPassword);

export default ORoutes;