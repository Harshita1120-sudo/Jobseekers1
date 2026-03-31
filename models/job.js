import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, " Job title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true],
    },
    address: {
      type: String,
      required: [true, "Job location is required"],
    },
    category: {
      type: String,
      required: [true, "Category(e.g. IT,HR) is required"],
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Remote"],
      required: true,
    },
    vacancy: {
      type: Number,
      default: 1,
    },
    salary: {
      type: String,
      required: [true, "Salary is required"],
    },
    experience: {
      type: String,
      required: [true, "Experience is required"], // e.g. "0-1 years", "2-4 years"
    },
    workMode: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid", "Work From Home"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true },
);
const Job = mongoose.model("Job", jobSchema);
export default Job;
