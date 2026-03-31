import mongoose from "mongoose";

const applicationSchema=new mongoose.Schema(
{
    jobId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Job",
        required:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    
    status:{
        type:String,
        enum:["applied","reviewed","shortlisted","rejected"],
        default:"applied",
    },
    resume:{
        type:String,
        required:[true,"Resume s required to apply"],
    }
},{timestamps:true}
);
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });
const Application=mongoose.model("Application",applicationSchema);
export default Application;