import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
export const authCompanyMiddleware=async(req,res,next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token=req.headers.authorization.split(" ")[1];
    }
    if(!token){
        return res.status(401).json({
            result:false,
            message:"No token,Company access denied"
        });
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        if(decoded.role!=="company"){
            return res.status(403).json({
                result:false,
                message:"Access denied,Not a company account."
            });
        }
        req.company=await Company.findById(decoded.id).select("-password");
        if(!req.company)
            return res.status(401).json({result:false,message:"Company not found"});
        next();
    } catch (error) {
       return res.status(401).json({
        result:false,
        message:"Invalid or expired token",
        error:error.message
       }) 
    }
}