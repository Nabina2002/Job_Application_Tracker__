import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },

  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },

  coverLetter: {
    type: String,
    required: [true, "Please provide a cover letter!"],
  },

  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },

  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },

  resume: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  /* Links this application back to the actual Job document so we can
     show jobTitle / company info without duplicating data */
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: false, // false so old/manual applications without a real job still work
  },

  /* Snapshot fields — filled in automatically from the Job at apply-time,
     or typed manually for self-logged applications. Kept on the
     Application itself so the record still makes sense even if the
     original Job posting is later deleted. */
  jobTitle: {
    type: String,
    default: "",
  },

  companyName: {
    type: String,
    default: "",
  },

  appliedDate: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["Applied", "Interviewing", "Offer", "Rejected"],
    default: "Applied",
  },

  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Job Seeker"],
      required: true,
    },
  },

  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Employer"],
      required: true,
    },
  },
});

export const Application = mongoose.model("Application", applicationSchema);