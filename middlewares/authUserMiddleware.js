import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const authMiddleware=async(req,res,next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token=req.headers.authorization.split(" ")[1];
    }
    if(!token){
        return res.status(401).json({
            result:false,
            message:"No token,User access denied"
        });
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        if(decoded.role!=="user"){
            return res.status(403).json({
                result:false,
                message:"Access denied,Not a user account."
            });
        }
        req.user=await User.findById(decoded.id).select("-password");
        if(!req.user)
            return res.status(401).json({result:false,message:"User not found"});
        next();
    } catch (error) {
       return res.status(401).json({
        result:false,
        message:"Invalid or expired token",
        error:error.message
       }) 
    }
}