import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import morgan from "morgan";
import path from "path";

import connectDB from "./config/db.js";
import uRoutes from "./routes/userRoutes.js";
import ORoutes from "./routes/otpRoutes.js";
import CRoutes from "./routes/companyRoutes.js";
import aRoutes from "./routes/adminRoutes.js";


//dotenv.config();
connectDB();

const app=express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({extended:true}));

// Static files (uploads folder)
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/user",uRoutes)
app.use("/api/otp",ORoutes)
app.use("/api/company",CRoutes)
app.use("/api/admin",aRoutes)

app.get("/",(req,res)=>{
    res.send("API is running")
    //res.status(200).json({ message: "API is running" }) 
})

const port=process.env.PORT || 7000;
app.listen(port,()=>{console.log(`Server is running on port ${port}`)});


